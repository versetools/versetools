import fnmatch
import io
import logging
import os
import re
import shutil
import struct
import sys
import typing
import zipfile
from pathlib import Path

import zstandard as zstd
from Crypto.Cipher import AES

from scdatatools import plugins
from scdatatools.utils import norm_path

logger = logging.getLogger(__name__)
ZIP_ZSTD = 100
p4kFileHeader = b"PK\x03\x14"
DEFAULT_P4K_KEY = b"\x5E\x7A\x20\x02\x30\x2E\xEB\x1A\x3B\xB6\x17\xC3\x0F\xDE\x1E\x47"
DEFAULT_CRYXML_CONVERT_FMT = "xml"

compressor_names = zipfile.compressor_names
compressor_names[100] = "zstd"


def monitor_msg_from_info(info):
    return f'{compressor_names[info.compress_type]} | {"Crypt" if info.is_encrypted else "Plain"} | {info.filename}'


def _p4k_extract_monitor(msg="", progress=None, total=None, level=logging.INFO, exc_info=None):
    """Default monitor for P4KFiles extract methods"""
    print(msg)


class _SharedFile(zipfile._SharedFile):
    def tell(self):
        # fix multi-threaded reading of zipfiles: https://bugs.python.org/issue42369
        return self._pos


def _P4KDecrypter(key):
    cipher = AES.new(key, AES.MODE_CBC, b"\x00" * 16)

    def decrypter(data):
        return cipher.decrypt(data)

    return decrypter


class ZStdDecompressor:
    def __init__(self):
        dctx = zstd.ZstdDecompressor()
        self._decomp = dctx.decompressobj()
        self.eof = False

    def decompress(self, data):
        result = b""
        try:
            result = self._decomp.decompress(data)
        except zstd.ZstdError:
            self.eof = True
        return result


class P4KExtFile(zipfile.ZipExtFile):
    MIN_READ_SIZE = 65536

    def __init__(self, fileobj, mode, p4kinfo, decrypter=None, close_fileobj=False):
        self.p4kinfo = p4kinfo
        self._is_encrypted = p4kinfo.is_encrypted
        self._decompressor = ZStdDecompressor()

        self._fileobj = fileobj
        self._decrypter = decrypter
        self._close_fileobj = close_fileobj

        self._compress_type = p4kinfo.compress_type
        self._compress_left = p4kinfo.compress_size
        self._left = p4kinfo.file_size

        self._eof = False
        self._readbuffer = b""
        self._offset = 0

        self.newlines = None

        self.mode = mode
        self.name = p4kinfo.filename

        if hasattr(p4kinfo, "CRC"):
            self._expected_crc = p4kinfo.CRC
            self._running_crc = zipfile.crc32(b"")
        else:
            self._expected_crc = None
        # TODO: the CRCs don't match, but im getting the same outputs as unp4k - we should figure out what exactly is
        #   going into calculating the CRC for P4K entry
        self._expected_crc = None

        self._seekable = False
        try:
            if fileobj.seekable():
                self._orig_compress_start = fileobj.tell()
                self._orig_compress_size = p4kinfo.compress_size
                self._orig_file_size = p4kinfo.file_size
                self._orig_start_crc = self._running_crc
                self._seekable = True
        except AttributeError:
            pass


class P4KInfo(zipfile.ZipInfo):
    def __init__(
        self,
        filename,
        date_time=(1980, 1, 1, 0, 0, 0),
        p4k=None,
        subinfo=None,
        archive=None,
    ):
        # ensure posix file paths as specified by the Zip format
        # super().__init__(*args, **kwargs)
        self.orig_filename = filename  # Original file name in archive
        self.filename = norm_path(filename)
        self.date_time = date_time  # year, month, day, hour, min, sec

        # Standard values:
        self.compress_type = zipfile.ZIP_STORED  # Type of compression for the file
        self._compresslevel = None  # Level for the compressor
        self.comment = b""  # Comment for each file
        self.extra = b""  # ZIP extra data
        if sys.platform == "win32":
            self.create_system = 0  # System which created ZIP archive
        else:
            # Assume everything else is unix-y
            self.create_system = 3  # System which created ZIP archive
        self.create_version = zipfile.DEFAULT_VERSION  # Version which created ZIP archive
        self.extract_version = zipfile.DEFAULT_VERSION  # Version needed to extract archive
        self.reserved = 0  # Must be zero
        self.flag_bits = 0  # ZIP flag bits
        self.volume = 0  # Volume number of file header
        self.internal_attr = 0  # Internal attributes
        self.external_attr = 0  # External file attributes
        self.compress_size = 0  # Size of the compressed file
        self.file_size = 0  # Size of the uncompressed file
        # Other attributes are set by class ZipFile:
        # header_offset         Byte offset to the file header
        # CRC                   CRC-32 of the uncompressed file
        self.p4k = p4k
        self.archive = archive
        self.subinfo = subinfo
        self.filelist = []
        if self.subinfo is not None and self.subinfo.is_dir():
            self.filename += "/"  # Make sure still tracked as directory
        self.is_encrypted = False

    def open(self, *args, **kwargs):
        return self.p4k.open(self, *args, **kwargs)

    def _decodeExtra(self):
        # Try to decode the extra field.
        self.is_encrypted = len(self.extra) >= 168 and self.extra[168] > 0x00

        # The following is the default ZipInfo decode, minus a few steps that would mark an encrypted it as invalid
        # TODO: only do this if self.is_encrypted, otherwise call super?

        offset = 0
        total = len(self.extra)
        while (offset + 4) < total:
            tp, ln = struct.unpack("<HH", self.extra[offset : offset + 4])
            if tp == 0x0001:
                if ln >= 24:
                    counts = struct.unpack("<QQQ", self.extra[offset + 4 : offset + 28])
                elif ln == 16:
                    counts = struct.unpack("<QQ", self.extra[offset + 4 : offset + 20])
                elif ln == 8:
                    counts = struct.unpack("<Q", self.extra[offset + 4 : offset + 12])
                elif ln == 0:
                    counts = ()
                else:
                    raise zipfile.BadZipFile("Corrupt extra field %04x (size=%d)" % (tp, ln))

                idx = 0
                # ZIP64 extension (large files and/or large archives)
                if self.file_size in (0xFFFFFFFFFFFFFFFF, 0xFFFFFFFF):
                    self.file_size = counts[idx]
                    idx += 1

                if self.compress_size == 0xFFFFFFFF:
                    self.compress_size = counts[idx]
                    idx += 1

                if self.header_offset == 0xFFFFFFFF:
                    self.header_offset = counts[idx]
                    idx += 1
            offset += ln + 4


class P4KFile(zipfile.ZipFile):
    filelist: typing.List[P4KInfo]
    NameToInfo: typing.Dict[typing.Text, P4KInfo]

    def __init__(self, file, mode="r", key=DEFAULT_P4K_KEY, load_monitor=None):
        # Using ZIP_STORED to bypass the get_compressor/get_decompressor logic in zipfile. Our P4KExtFile will always
        # use zstd
        self.key = key
        self.NameToInfoLower = {}
        self.BaseNameToInfo = {}
        self.subarchives = {}
        self.file_tree = {}

        if load_monitor is None:
            self._load_monitor = lambda *a, **kw: True
        else:
            self._load_monitor = load_monitor

        super().__init__(file, mode, compression=zipfile.ZIP_STORED)

        # TODO: this doubles the time of opening a pack, so add some logic to delay expansion and add functionality to
        #       expand on the fly
        # open up sub-archives and add them to the file list
        # for filename in self.subarchives.keys():
        self._update_file_tree()

    def _update_file_tree(self):
        for path in self.filelist:
            parent = self.file_tree
            for part in path.filename.split('/'):
                parent = parent.setdefault(part, {})

    def expand_subarchives(self):
        """Ensures all sub-archives have been expanded"""
        for filename, info in self.subarchives.items():
            if info is None:
                self._expand_subarchive(filename)
        self._update_file_tree()

    def _expand_subarchive(self, filename):
        if self.subarchives[filename] is not None:
            return  # already been opened
        file_ext = f"{filename.split('.', maxsplit=1)[-1]}"
        info = self.NameToInfo[filename]
        self.subarchives[filename] = SUB_ARCHIVES[file_ext](self.open(info))
        info.subarchive = self.subarchives[filename]

        base_p4k_path = Path(filename[: -1 * len(file_ext) - 1])
        archive_name = base_p4k_path.name
        for si in info.subarchive.filelist:
            # Create ZipInfo instance to store file information
            # parent extension gets removed
            # e.g. `100i_interior.socpak` -> `100i_interior`
            sub_path = Path(si.filename)
            if sub_path.parts[0] == archive_name:
                # Paths in socpaks are referenced slightly strangely.
                sub_path = Path(*sub_path.parts[1:])
            x = P4KInfo(
                str(base_p4k_path / sub_path),
                p4k=self,
                subinfo=si,
                archive=self.subarchives[filename],
            )
            x.extra = si.extra
            x.comment = si.comment
            x.header_offset = si.header_offset
            x.volume, x.internal_attr, x.external_attr = (
                si.volume,
                si.internal_attr,
                si.external_attr,
            )
            x._raw_time = si._raw_time
            x.date_time = si.date_time
            x.create_version = si.create_version
            x.create_system = si.create_system
            x.extract_version = si.extract_version
            x.reserved = si.reserved
            x.flag_bits = si.flag_bits
            x.compress_type = si.compress_type
            x.CRC = si.CRC
            x.compress_size = si.compress_size
            x.file_size = si.file_size

            info.filelist.append(x)
            self.filelist.append(x)
            self.NameToInfo[x.filename] = x
            self.NameToInfoLower[x.filename.casefold()] = x
            self.BaseNameToInfo.setdefault(
                x.filename.split(".", maxsplit=1)[0].casefold(), []
            ).append(x)

    def _RealGetContents(self):
        """Read in the table of contents for the ZIP file."""
        fp = self.fp
        try:
            endrec = zipfile._EndRecData(fp)
        except OSError:
            raise zipfile.BadZipFile("File is not a valid p4k file")
        if not endrec:
            raise zipfile.BadZipFile("File is not a valid p4k file")
        size_cd = endrec[zipfile._ECD_SIZE]  # bytes in central directory
        offset_cd = endrec[zipfile._ECD_OFFSET]  # offset of central directory
        self._comment = endrec[zipfile._ECD_COMMENT]  # archive comment

        # "concat" is zero, unless zip was concatenated to another file
        concat = endrec[zipfile._ECD_LOCATION] - size_cd - offset_cd
        if endrec[zipfile._ECD_SIGNATURE] == zipfile.stringEndArchive64:
            # If Zip64 extension structures are present, account for them
            concat -= zipfile.sizeEndCentDir64 + zipfile.sizeEndCentDir64Locator

        # self.start_dir:  Position of start of central directory
        self.start_dir = offset_cd + concat
        fp.seek(self.start_dir, 0)
        data = io.BytesIO(fp.read(size_cd))
        while data.tell() < size_cd:
            centdir = data.read(zipfile.sizeCentralDir)
            if len(centdir) != zipfile.sizeCentralDir:
                raise zipfile.BadZipFile("Truncated central directory")
            centdir = struct.unpack(zipfile.structCentralDir, centdir)
            if centdir[zipfile._CD_SIGNATURE] != zipfile.stringCentralDir:
                raise zipfile.BadZipFile("Bad magic number for central directory")

            filename = data.read(centdir[zipfile._CD_FILENAME_LENGTH])
            flags = centdir[5]
            if flags & 0x800:
                # UTF-8 file names extension
                filename = filename.decode("utf-8")
            else:
                # Historical ZIP filename encoding
                filename = filename.decode("cp437")

            if self._load_monitor is not None:
                self._load_monitor(msg=filename, progress=data.tell(), total=size_cd)

            # Create ZipInfo instance to store file information
            x = P4KInfo(filename, p4k=self, archive=self)
            x.extra = data.read(centdir[zipfile._CD_EXTRA_FIELD_LENGTH])
            x.comment = data.read(centdir[zipfile._CD_COMMENT_LENGTH])
            x.header_offset = centdir[zipfile._CD_LOCAL_HEADER_OFFSET]
            (
                x.create_version,
                x.create_system,
                x.extract_version,
                x.reserved,
                x.flag_bits,
                x.compress_type,
                t,
                d,
                x.CRC,
                x.compress_size,
                x.file_size,
            ) = centdir[1:12]
            if x.extract_version > zipfile.MAX_EXTRACT_VERSION:
                raise NotImplementedError("zip file version %.1f" % (x.extract_version / 10))
            # x.volume, x.internal_attr, x.external_attr = centdir[15:18]
            # Convert date/time code to (year, month, day, hour, min, sec)
            x._raw_time = t
            x.date_time = (
                (d >> 9) + 1980,
                (d >> 5) & 0xF,
                d & 0x1F,
                t >> 11,
                (t >> 5) & 0x3F,
                (t & 0x1F) * 2,
            )

            x._decodeExtra()
            x.header_offset = x.header_offset + concat
            self.filelist.append(x)
            self.NameToInfo[x.filename] = x
            self.NameToInfoLower[x.filename.casefold()] = x
            self.BaseNameToInfo.setdefault(
                x.filename.split(".", maxsplit=1)[0].casefold(), []
            ).append(x)

            # Add sub-archives to be opened later (.pak/.sockpak,etc)
            file_ext = x.filename.split(".", maxsplit=1)[-1]
            if file_ext.casefold() in SUB_ARCHIVES:
                if x.filename not in self.subarchives:
                    self.subarchives[x.filename] = None

    def open(self, name, mode="r", pwd=None, *, force_zip64=False):
        """Return file-like object for 'name'.

        name is a string for the file name within the ZIP file, or a ZipInfo
        object.

        mode should be 'r' to read a file already in the ZIP file, or 'w' to
        write to a file newly added to the archive.

        pwd is the password to decrypt files (only used for reading).

        When writing, if the file size is not known in advance but may exceed
        2 GiB, pass force_zip64 to use the ZIP64 format, which can handle large
        files.  If the size is known in advance, it is best to pass a ZipInfo
        instance for name, with zinfo.file_size set.
        """
        mode = mode.strip("b")
        if mode not in {"r", "w"}:
            raise ValueError('open() requires mode "r" or "w"')
        if pwd and not isinstance(pwd, bytes):
            raise TypeError("pwd: expected bytes, got %s" % type(pwd).__name__)
        if pwd and (mode == "w"):
            raise ValueError("pwd is only supported for reading files")
        if not self.fp:
            raise ValueError("Attempt to use ZIP archive that was already closed")

        # Make sure we have an info object
        if isinstance(name, P4KInfo):
            # 'name' is already an info object
            zinfo = name
        elif mode == "w":
            zinfo = P4KInfo(name, p4k=self, archive=self)
            zinfo.compress_type = self.compression
            zinfo._compresslevel = self.compresslevel
        else:
            # Get info object for name
            zinfo = self.getinfo(name)

        # if file is in a sub-archive, let that archive handle it
        if zinfo.subinfo is not None:
            return zinfo.archive.open(zinfo.subinfo, mode=mode, pwd=pwd, force_zip64=force_zip64)

        if mode == "w":
            return self._open_to_write(zinfo, force_zip64=force_zip64)

        if self._writing:
            raise ValueError(
                "Can't read from the ZIP file while there "
                "is an open writing handle on it. "
                "Close the writing handle before trying to read."
            )

        # Open for reading:
        self._fileRefCnt += 1
        zef_file = _SharedFile(
            self.fp,
            zinfo.header_offset,
            self._fpclose,
            self._lock,
            lambda: self._writing,
        )
        try:
            # Skip the file header:
            fheader = zef_file.read(zipfile.sizeFileHeader)
            if len(fheader) != zipfile.sizeFileHeader:
                raise zipfile.BadZipFile("Truncated file header")
            fheader = struct.unpack(zipfile.structFileHeader, fheader)
            if (
                fheader[zipfile._FH_SIGNATURE] != p4kFileHeader
                and fheader[zipfile._FH_SIGNATURE] != zipfile.stringFileHeader
            ):
                raise zipfile.BadZipFile("Bad magic number for file header")

            fname = zef_file.read(fheader[zipfile._FH_FILENAME_LENGTH])
            if fheader[zipfile._FH_EXTRA_FIELD_LENGTH]:
                zef_file.read(fheader[zipfile._FH_EXTRA_FIELD_LENGTH])

            if zinfo.flag_bits & 0x20:
                # Zip 2.7: compressed patched data
                raise NotImplementedError("compressed patched data (flag bit 5)")

            if zinfo.flag_bits & 0x40:
                # strong encryption
                raise NotImplementedError("strong encryption (flag bit 6)")

            if zinfo.flag_bits & 0x800:
                # UTF-8 filename
                fname_str = fname.decode("utf-8")
            else:
                fname_str = fname.decode("cp437")

            if fname_str.lower() != zinfo.orig_filename.lower():
                raise zipfile.BadZipFile(
                    "File name in directory %r and header %r differ." % (zinfo.orig_filename, fname)
                )

            zd = None
            if self.key and zinfo.is_encrypted:
                zd = _P4KDecrypter(self.key)

            return P4KExtFile(zef_file, mode, zinfo, zd, True)
        except:
            zef_file.close()
            raise

    def getinfo(self, name, case_insensitive=True):
        name = norm_path(name)
        try:
            info = super().getinfo(name)
        except KeyError:
            if not case_insensitive:
                raise
            info = self.NameToInfoLower.get(name.casefold())
            if info is None:
                raise KeyError("There is no item named %r in the archive" % name)
        return info

    def search(
        self,
        file_filters: typing.Union[list, tuple, set, str],
        exclude: typing.List[str] = None,
        ignore_case: bool = True,
        expand_subarchives: bool = False,
        mode: str = "re",
    ) -> typing.List[P4KInfo]:
        """
        Search the filelist by path

        :param file_filters:
        :param ignore_case: Match string case or not
        :param expand_subarchives: Automatically expand sub-archives and search them as well.
        :param exclude: List of filenames that should be excluded from the results.
            This must be an exact match (although honors ignore_case).
        :param mode: Method of performing a match. Valid values are:
            `re`:   File matching glob compiled into a regular expression - `re.match(filename)`
            `startswith`:  Uses the string `startswith` function - if any(filename.startswith(_) for _ in file_filters)
            `endswith`:  Uses the string `startswith` function - if any(filename.endswith(_) for _ in file_filters)
            `in`:   Performs and `in` check - filename in file_filters
            `in_strip`: Performs an `in` check, but strips the file extension before performing the `in` check
        :return:
        """
        if not isinstance(file_filters, (list, tuple, set)):
            file_filters = [file_filters]

        # normalize path slashes from windows to posix
        file_filters = [norm_path(_) for _ in file_filters]
        exclude = exclude or []

        if ignore_case:
            file_filters = [_.casefold() for _ in file_filters]
            exclude = [_.casefold() for _ in exclude]

        def walk_items():
            nonlocal ignore_case, expand_subarchives
            i = 0
            while i < len(self.filelist):
                f = self.filelist[i]
                if f.filename in self.subarchives and expand_subarchives:
                    self._expand_subarchive(f.filename)
                if ignore_case:
                    yield f.filename.casefold(), f
                else:
                    yield f.filename, f
                i += 1

        if mode == "re":

            def in_exclude(f):
                nonlocal ignore_case, exclude
                return f.casefold() in exclude if ignore_case else f in exclude

            r = re.compile(
                "|".join(f"({fnmatch.translate(_)})" for _ in file_filters),
                flags=re.IGNORECASE if ignore_case else 0,
            )
            return [info for fn, info in walk_items() if r.match(fn) and not in_exclude(fn)]
        elif mode == "startswith":
            return [
                info
                for fn, info in walk_items()
                if any(fn.startswith(_) for _ in file_filters) and fn not in exclude
            ]
        elif mode == "endswith":
            return [
                info
                for fn, info in walk_items()
                if any(fn.endswith(_) for _ in file_filters) and fn not in exclude
            ]
        elif mode == "in":
            return [
                info
                for fn, info in walk_items()
                if any(_ in fn for _ in file_filters) and fn not in exclude
            ]
        elif mode == "in_strip":
            return [
                info
                for fn, info in walk_items()
                if fn.split(".", maxsplit=1)[0] in file_filters and fn not in exclude
            ]

        raise AttributeError(f"Invalid search mode: {mode}")

    def extract_filter(self, file_filter, *args, ignore_case=True, search_mode="re", **kwargs):
        return self.extractall(
            members=self.search(file_filter, ignore_case=ignore_case, mode=search_mode),
            *args,
            **kwargs,
        )

    def extract(self, member, *args, **kwargs):
        """Extract a member from the archive to the current working directory,
        using its full name. Its file information is extracted as accurately
        as possible. `member' may be a filename or a ZipInfo object. You can
        specify a different directory using `path'.
        """
        return self.extractall(members=[member], *args, **kwargs)

    def save_to(self, member, *args, **kwargs):
        """Extract a member into `path`. This will no recreate the archive directory structure, it will place the
        extracted file directly into `path` which must exist. Use `extract`"""
        return self.extractall(members=[member], *args, **kwargs)

    def extractall(
        self,
        path=None,
        members: typing.List[typing.Union[P4KInfo, str]] = None,
        overwrite: bool = True,
        save_to: bool = False,
        converters: typing.Union[str, typing.List[str]] = None,
        converter_options: dict = None,
        ignore_converter_errors: bool = False,
        monitor: typing.Callable = _p4k_extract_monitor,
    ):
        """Extract all members from the archive to the current working directory. `path' specifies a different
        directory to extract to. `members' is optional and must be a subset of the list returned by namelist().

        :param path: The output directory to extract files to, defaults to the current working directory
        :param members: List of the members of the P4K to extract
        :param overwrite: Overwrite files that already exist
        :param save_to: If true, the `members` will be extracted without recreating their full path within `path`
        :param converters: List of `P4KConverterPlugins` to use to convert `members` as they are extracted. Use 'auto'
            to automatically run all configured converters.
        :param converter_options: Dictionary of kwargs to pass to the specified converters, allowing converter specific
            options to be passed
        :param ignore_converter_errors: If `True` errors within converters will be logged, but extraction will continue
            and the unconverted files will be extracted
        :param monitor: Callable used to monitor the progress of the. Set to None to disable monitoring. The callable
            will be passed (info: P4KInfo, cur_index, total_members)
        """
        if members is None:
            members = self.filelist

        if path is None:
            path = os.getcwd()
        else:
            path = os.fspath(path)

        extracted_files = []

        if not isinstance(converters, list):
            converters = [converters]

        converters = converters or []
        converter_handlers = plugins.P4KConverterPlugin.converters()

        if "auto" in converters:
            converters = converter_handlers
        elif converters:
            converters = {
                k: v
                for k, v in converter_handlers.items()
                if k in converters or v["handler"].name in converters or v["handler"] in converters
            }
        else:
            converters = {}

        total = len(members)

        for name, hook in converters.items():
            try:
                # converters will return the members the did not handle
                converter = hook["handler"]

                if not issubclass(converter, plugins.P4KConverterPlugin):
                    logging.error(f"Invalid converter handler {name}")
                    continue

                members, ext = hook["handler"].convert(
                    members=members,
                    path=Path(path),
                    overwrite=overwrite,
                    save_to=save_to,
                    options=converter_options,
                    monitor=monitor,
                )
                extracted_files.extend(ext)
            except Exception as e:
                if ignore_converter_errors:
                    logger.exception(f"There was an error running the {name} converter", exc_info=e)
                else:
                    raise

        for i, info in enumerate(members):
            if ext_path := self._extract_member(info, path, save_to=save_to, overwrite=overwrite):
                if monitor is not None:
                    monitor(msg=monitor_msg_from_info(info), progress=i, total=total)
                extracted_files.append(ext_path)
        return extracted_files

    def close(self) -> None:
        for archive in self.subarchives.values():
            if archive is not None:
                archive.close()
        super().close()

    def _extract_member(self, member, targetpath, pwd=None, save_to=False, overwrite=True):
        """Extract the ZipInfo object 'member' to a physical file on the path targetpath."""
        if not isinstance(member, P4KInfo):
            member = self.getinfo(member)

        if save_to:
            outpath = Path(targetpath) / Path(member.filename).name
        else:
            outpath = Path(targetpath) / Path(member.filename)

        if outpath.is_file() and not overwrite:
            return None

        if save_to:
            with self.open(member, pwd=pwd) as source, outpath.open("wb") as target:
                shutil.copyfileobj(source, target)
        else:
            outpath = super()._extract_member(member, targetpath, pwd)

        return outpath


class _ZipFileWithFlexibleFilenames(zipfile.ZipFile):
    """A regular ZipFile that doesn't enforce filenames perfectly matching the CD filename"""

    def open(self, name, mode="r", pwd=None, *, force_zip64=False):
        if mode not in {"r", "w"}:
            raise ValueError('open() requires mode "r" or "w"')
        if pwd and not isinstance(pwd, bytes):
            raise TypeError("pwd: expected bytes, got %s" % type(pwd).__name__)
        if pwd and (mode == "w"):
            raise ValueError("pwd is only supported for reading files")
        if not self.fp:
            raise ValueError("Attempt to use ZIP archive that was already closed")

        # Make sure we have an info object
        if isinstance(name, zipfile.ZipInfo):
            # 'name' is already an info object
            zinfo = name
        elif mode == "w":
            zinfo = zipfile.ZipInfo(name)
            zinfo.compress_type = self.compression
            zinfo._compresslevel = self.compresslevel
        else:
            # Get info object for name
            zinfo = self.getinfo(name)

        if mode == "w":
            return self._open_to_write(zinfo, force_zip64=force_zip64)

        if self._writing:
            raise ValueError(
                "Can't read from the ZIP file while there "
                "is an open writing handle on it. "
                "Close the writing handle before trying to read."
            )

        # Open for reading:
        self._fileRefCnt += 1
        zef_file = _SharedFile(
            self.fp,
            zinfo.header_offset,
            self._fpclose,
            self._lock,
            lambda: self._writing,
        )
        try:
            # Skip the file header:
            fheader = zef_file.read(zipfile.sizeFileHeader)
            if len(fheader) != zipfile.sizeFileHeader:
                raise zipfile.BadZipFile("Truncated file header")
            fheader = struct.unpack(zipfile.structFileHeader, fheader)
            if fheader[zipfile._FH_SIGNATURE] != zipfile.stringFileHeader:
                raise zipfile.BadZipFile("Bad magic number for file header")

            fname = zef_file.read(fheader[zipfile._FH_FILENAME_LENGTH])
            if fheader[zipfile._FH_EXTRA_FIELD_LENGTH]:
                zef_file.read(fheader[zipfile._FH_EXTRA_FIELD_LENGTH])

            if zinfo.flag_bits & 0x20:
                # Zip 2.7: compressed patched data
                raise NotImplementedError("compressed patched data (flag bit 5)")

            if zinfo.flag_bits & 0x40:
                # strong encryption
                raise NotImplementedError("strong encryption (flag bit 6)")

            # check for encrypted flag & handle password
            is_encrypted = zinfo.flag_bits & 0x1
            if is_encrypted:
                if not pwd:
                    pwd = self.pwd
                if not pwd:
                    raise RuntimeError(
                        "File %r is encrypted, password " "required for extraction" % name
                    )
            else:
                pwd = None

            return zipfile.ZipExtFile(zef_file, mode, zinfo, pwd, True)
        except:
            zef_file.close()
            raise


class SOCPak(_ZipFileWithFlexibleFilenames):
    pass


class Pak(_ZipFileWithFlexibleFilenames):
    pass


# Down here so the can reference local classes
SUB_ARCHIVES = {"pak": Pak, "socpak": SOCPak}
