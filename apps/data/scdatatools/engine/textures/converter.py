import concurrent.futures
import enum
import io
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import typing
from pathlib import Path

from scdatatools import plugins
from scdatatools.p4k import P4KInfo, monitor_msg_from_info
from scdatatools.utils import NamedBytesIO
from . import dds

logger = logging.getLogger(__name__)


class ConverterUtility(enum.Enum):
    default = "default"
    texconv = "texconv"
    compressonator = "compressonator"


# normal maps and glossmaps need to force texconv to use specific formats
TEXCONV_DEFAULT_ARGS = " -f rgba"
# TEXCONV_DDNA_ARGS = " -f B8G8R8A8_UNORM -nmap rgb -nmapamp 10.0"
TEXCONV_DDNA_ARGS = " -f B8G8R8A8_UNORM"
TEXCONV_GLOSSMAP_ARGS = " -f BC4_UNORM"

DEFAULT_TEXCONV_ARGS = "-nologo"
DEFAULT_COMPRESSONATOR_ARGS = "-noprogress"

DDS_CONV_FALLBACK = "png"
DDS_CONV_FORMAT = {
    "linux": "png",
    "darwin": "png",
    "win32": "png",  # this used to be tif, then i asked myself, why?
}


class ConverterUnavailable(Exception):
    pass


class ConversionError(Exception):
    pass


COMPRESSONATORCLI = shutil.which("compressonatorcli")
TEXCONV = shutil.which("texconv")


def _check_bin(converter=ConverterUtility.default, converter_bin=""):
    if converter != ConverterUtility.default and converter_bin:
        return converter, converter_bin
    elif converter == ConverterUtility.default and converter_bin:
        raise ValueError(
            f"Cannot specify converter_bin and `ConverterUtility.default` at the same time"
        )

    if converter == ConverterUtility.default:
        if TEXCONV:
            return ConverterUtility.texconv, TEXCONV
        if COMPRESSONATORCLI:
            return ConverterUtility.compressonator, COMPRESSONATORCLI
        raise ConverterUnavailable(
            "Converter is not available. Please make sure `texconv` or "
            "`compressonatorcli` is in your system PATH"
        )
    elif converter == ConverterUtility.texconv:
        if not TEXCONV:
            raise ConverterUnavailable(
                "Converter is not available. Please make sure `texconv` is in your system PATH"
            )
        return ConverterUtility.texconv, TEXCONV
    elif converter == ConverterUtility.compressonator:
        if not COMPRESSONATORCLI:
            raise ConverterUnavailable(
                "Converter is not available. Please make sure `compressonatorcli` is in your "
                "system PATH"
            )
        return ConverterUtility.compressonator, COMPRESSONATORCLI
    else:
        raise ValueError(f"Invalid ConverterUtility: {converter}")


def convert_buffer(
    inbuf: bytes,
    in_format: object,
    out_format: str = "default",
    converter: ConverterUtility = ConverterUtility.default,
    converter_cli_args: str = "",
    converter_bin: str = "",
) -> (bytes, str):
    """
    Converts a buffer `inbuf` to the output format `out_format`. See :func:convert for more information on parameters

    :param inbuf: Bytes of the texture to convert
    :param in_format: `str` of the import format (e.g. 'dds')
    :param out_format: The desired output format. Default's to the default output format for the platform, 'default'
    :param converter: Which :enum:`ConverterUtility` to use for the conversion (texconv or compressonatorcli)
    :param converter_cli_args: Additional command line args to pass to the converter.`converter` cannot be `default`
    :param converter_bin: Override the path to the converter binary. `converter` cannot be `default`
    :return: Tuple containing the `bytes` of the converted image in the specified `output_format` and the `str` format
        of the returned `bytes`
    """

    out_format = (
        DDS_CONV_FORMAT.get(sys.platform, DDS_CONV_FALLBACK)
        if out_format == "default"
        else out_format
    )
    out_format = out_format.replace(".", "")
    _ = tempfile.NamedTemporaryFile(suffix=f".{out_format}")
    tmpout = Path(_.name)
    _.close()

    tex_convert(
        NamedBytesIO(inbuf, name=f"tmp.{in_format}"),
        tmpout,
        converter=converter,
        converter_cli_args=converter_cli_args,
        converter_bin=converter_bin,
    )

    tex = tmpout.open("rb").read()
    Path(tmpout).unlink()

    return tex, out_format


def tex_convert(
    infile: typing.Union[str, Path, io.BufferedIOBase, io.RawIOBase, NamedBytesIO],
    outfile: typing.Union[str, Path],
    converter: ConverterUtility = ConverterUtility.default,
    converter_cli_args: str = "",
    converter_bin: str = "",
    overwrite: bool = False,
) -> Path:
    """Convert the texture file provided by `infile` to `outfile` using the an external converter. By default, this
    will attempt to use `texconv`. If that fails, or isn't available, then it'll attempt to use `compressonatorcli`.
    Setting `converter` explicitly will disable this behavior and only attempt the chosen `converter`.

    The output format is determined from the extension of `outfile`

    :param infile:  A `str`, `Path`, file-like object or bytes of the input texture
    :param outfile:  The output file path. Glossmaps will alter the output filename. Be sure to check the returned
        path if necessary.
    :param converter:  Which converter to use. By default `texconv` will be used if available, if not then
        `compressonatorcli`. Set to `converter.COMPRESSONATOR` force using `compressonatorcli`.
    :param converter_cli_args:  Override the additional CLI arguments passed to the converter. You must specify which
        converter to use when specifying `cli_args`
    :param converter_bin: Override the path to the converter binary. `converter` cannot be `default`
    :param overwrite: Overwrite `outfile` if it already exists
    :raises:
        ConversionError: If the converter does not exit cleanly. Output from the converter will be supplied
        ConverterUnavailable: If the specified `converter_bin` is invalid, or if `texconv` or `compressonatorcli`
            cannot be found on the system's `PATH`
    :return: :class:`Path` of the converted image if successful
    """
    if converter_cli_args and converter == ConverterUtility.default:
        raise ValueError(
            f"You must specify which converter to use when supplying converter_cli_args"
        )
    try_compressonator = converter == ConverterUtility.default
    converter, converter_bin = _check_bin(converter, converter_bin)

    if isinstance(outfile, str):
        outfile = Path(outfile)
    if outfile.exists():
        if overwrite:
            outfile.unlink()
        else:
            raise ValueError(f'outfile "{outfile}" already exists')

    if isinstance(infile, (io.BufferedIOBase, io.RawIOBase)):
        in_name = "bytes.dds"  # raw bytes are assumed to be `.dds`
    else:
        in_name = infile.name

    tmpin = tempfile.NamedTemporaryFile(
        suffix=".dds" if dds.is_glossmap(in_name) else Path(in_name).suffix,
        delete=False,
    )
    try:
        if isinstance(infile, (str, Path)):
            with open(infile, "rb") as f:
                tmpin.write(f.read())
        else:
            infile.seek(0)
            tmpin.write(infile.read())

        # TODO: logging...

        # Make sure we're not preventing access to the in file
        tmpin.close()
        ft = outfile.suffix[1:]  # remove the '.'

        # use `texconv`
        err_msg = ""

        Path(outfile).parent.mkdir(parents=True, exist_ok=True)
        if converter in [ConverterUtility.default, ConverterUtility.texconv]:
            if dds.is_glossmap(infile.name):
                converter_cli_args = (
                    DEFAULT_TEXCONV_ARGS + TEXCONV_GLOSSMAP_ARGS + converter_cli_args
                )
            elif dds.is_normals(infile.name):
                converter_cli_args = DEFAULT_TEXCONV_ARGS + TEXCONV_DDNA_ARGS + converter_cli_args
            else:
                converter_cli_args = (
                    DEFAULT_TEXCONV_ARGS + TEXCONV_DEFAULT_ARGS + converter_cli_args
                )
            cmd = f'"{converter_bin}" -ft {ft} {converter_cli_args} "{tmpin.name}"'
            try:
                r = subprocess.run(
                    cmd,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    check=True,
                    cwd=outfile.parent,
                )
                # texconv outputs to the same location as the input file, so move it to the requested output path
                # if successful
                shutil.move(outfile.parent / f"{Path(tmpin.name).stem}.{ft}", outfile.absolute())
                return outfile
            except subprocess.CalledProcessError as e:
                err_msg = (
                    f'Error converting with texconv: {e.output.decode("utf-8", errors="ignore")}'
                )
                if not try_compressonator:
                    raise ConversionError(err_msg)

        # use `compressonatorcli` if chosen, or if texconv isn't available/failed and default is chosen
        if converter == ConverterUtility.compressonator or try_compressonator:
            if try_compressonator:
                # we've failed into compressonator, so pick-up it's path
                try:
                    converter, converter_bin = _check_bin(ConverterUtility.compressonator)
                except ConverterUnavailable:
                    # compressonator not available, return texconv error
                    raise ConversionError(err_msg)
            converter_cli_args = (
                converter_cli_args if converter_cli_args else DEFAULT_COMPRESSONATOR_ARGS
            )
            cmd = f"{converter_bin} {converter_cli_args} {tmpin.name} {outfile.absolute()}"
            try:
                r = subprocess.run(
                    cmd,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    check=True,
                )
                return outfile
            except subprocess.CalledProcessError as e:
                err = f'Error converting with compressonator: {e.output.decode("utf-8", errors="ignore")}'
                if err_msg:
                    raise ConversionError(
                        f"Failed to convert with texconv and compressonatorcli:\n\n{err_msg}\n{err}"
                    )
                raise ConversionError(err)
    finally:
        os.unlink(tmpin.name)


@plugins.register
class DDSTextureConverter(plugins.P4KConverterPlugin):
    name = "ddstexture_converter"
    display_name = "DDS Converter"
    handles = [".dds"]

    @classmethod
    def convert(
        cls,
        members: typing.List["P4KInfo"],
        path: typing.Union[Path, str],
        overwrite: bool = False,
        save_to: bool = False,
        options: typing.Dict = None,
        monitor: typing.Callable = None,
    ) -> typing.Tuple[typing.List["P4KInfo"], typing.List[Path]]:

        options = options or {}
        output_fmt = options.get("ddstexture_converter_fmt", "dds").casefold()

        if output_fmt == "dds" and not options.get("ddstexture_converter_unsplit", False):
            # output dds and unsplit not checked, do nothing
            return members, []

        converter = ConverterUtility(options.get("ddstexture_converter_converter", "default"))
        converter_bin = options.get("ddstexture_converter_converter_bin", "")
        converter_cli_args = options.get("ddstexture_converter_converter_cli_args", "")
        replace = options.get("ddstexture_converter_replace", False)

        unhandled_members = []
        extracted_paths = []
        to_convert = []
        while members:
            f = members[
                -1
            ]  # collect_parts needs the file to be in the list, so pop it later, -1 since we're popping
            if ".dds" not in f.filename.casefold():
                unhandled_members.append(members.pop())
            else:
                parts = dds.collect_parts(f, from_list=members)
                outpath = cls.outpath(path, next(iter(parts.values())), save_to)
                is_glossmap = dds.is_glossmap(outpath)

                out_name = outpath.name.split(".", maxsplit=1)[0]
                if is_glossmap:
                    out_name += ".glossmap"

                outdds = outpath.with_name(out_name + (".dds.a" if is_glossmap else ".dds"))
                if output_fmt == "dds":
                    outpath = outdds
                else:
                    outpath = outpath.with_name(f"{out_name}.{output_fmt}")

                for info in parts.values():
                    members.remove(info)

                if overwrite or not outdds.is_file():
                    if not overwrite and outpath.is_file() and replace:
                        continue  # texture was already converted and we would get rid of the dds, skip
                    try:
                        # only unsplit
                        dds.unsplit_dds(parts, outdds)
                        if monitor is not None:
                            dds_header = [
                                _ for _ in parts if _.endswith(".dds") or _.endswith(".dds.a")
                            ][0]
                            monitor(monitor_msg_from_info(parts[dds_header]))

                        if output_fmt != "dds":
                            to_convert.append((outdds, outpath))
                        extracted_paths.append(outpath.as_posix())
                    except Exception:
                        logger.exception(f"Failed to un-split texture")
                        # re-add the parts to the unhandled so they at least get exported
                        for info in parts.values():
                            unhandled_members.append(info)

        def _do_convert(tex_in, tex_out):
            try:
                out = tex_convert(
                    infile=tex_in,
                    outfile=tex_out,
                    converter=converter,
                    converter_bin=converter_bin,
                    converter_cli_args=converter_cli_args,
                    overwrite=overwrite,
                )
                if replace:
                    tex_in.unlink()
            except Exception as e:
                return tex_in, str(e)
            return out, ""

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
            for conv in to_convert:
                futures.append(executor.submit(_do_convert, tex_in=conv[0], tex_out=conv[1]))
            for future in concurrent.futures.as_completed(futures):
                if monitor is not None:
                    out, error = future.result()
                    if error:
                        monitor(f"failed to convert {out}: {error}")
                    else:
                        extracted_paths.append(out.as_posix())
                        monitor(f"converted {out}")

        return unhandled_members, extracted_paths
