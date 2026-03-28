import struct
import typing
from pathlib import Path

from scdatatools.p4k import P4KInfo


class DDSNotSplit(Exception):
    pass


def is_glossmap(dds_filename: typing.Union[Path, str]) -> bool:
    return str(dds_filename)[-1] == "a"


def is_normals(dds_filename) -> bool:
    return "_ddna" in str(dds_filename)


def unsplit_dds(
    dds_files: typing.Dict[str, typing.Union[P4KInfo, Path, typing.IO, bytes]],
    outfile: typing.Union[Path, str] = "-",
) -> typing.Union[bytes, Path]:
    """
    Unsplit a split `.dds` (or `.dds.a`) texture (a `.dds` with `.dds.N` files next to it where `.N` is a partial piece
    of the `.dds`) into a single, valid `.dds` texture file.

    :param dds_files: `dict` containing all the pieces of a split texture file. The key should be the
        filename of the component, and the value should be a file-like object or bytes of the texture.
    :param outfile: The path of to write the output to. Pass '-' to have the unsplit texture buffer returned directly.
    :return: The recombined bytes if `outfile` is '-', otherwise the `Path` of the output file
    """

    parts = {}
    dds_header = None
    hdr_data = None

    # extract the DDS header from the `.dds` top file
    for n, p in dds_files.items():
        if n.endswith(".dds") or n.endswith(".dds.a"):
            dds_header = n
            hdr_data = p
        else:
            parts[n] = p

    if hdr_data is None:
        raise DDSNotSplit(
            f'Could not determine the DDS header file from {",".join(dds_files.keys())}'
        )

    if isinstance(hdr_data, (P4KInfo, Path)):
        hdr_data = hdr_data.open("rb").read()
    if not isinstance(hdr_data, bytes):
        hdr_data = hdr_data.read()

    # glossmap's don't have the DDS header... add it so texconv will work
    glossmap = is_glossmap(dds_header)
    if glossmap:
        hdr_data = b"DDS " + hdr_data

    dds_magic, dds_hdr_len = struct.unpack("<4sI", hdr_data[:8])
    dds_hdr_len += 4  # hdr_len does not include the magic bytes
    if dds_magic != b"DDS ":
        raise ValueError(f"Invalid DDS header")

    if hdr_data[84:88] == b"DX10":
        dds_hdr_len += 20

    dds_file = hdr_data[:dds_hdr_len]
    # unsplit files should be largest to smallest
    for dds in sorted([_ for _ in parts.keys()], reverse=True, key=lambda d: d.split(".")[-1]):
        if is_glossmap(dds) and not glossmap:
            continue
        elif not is_glossmap(dds) and glossmap:
            continue

        if isinstance(parts[dds], (P4KInfo, Path)):
            dds_file += parts[dds].open("rb").read()
        elif isinstance(parts[dds], bytes):
            dds_file += parts[dds]
        else:
            dds_file += parts[dds].read()

    # finally add the remainder of the `.dds` top file, `.dds.0` if you will
    dds_file += hdr_data[dds_hdr_len:]

    if outfile == "-":
        return dds_file

    Path(outfile).parent.mkdir(parents=True, exist_ok=True)
    with open(outfile, "wb") as out:
        out.write(dds_file)
    return Path(outfile)


def collect_parts(
    dds_file: typing.Union[str, Path, P4KInfo], from_list: typing.List[P4KInfo] = None
) -> typing.Dict:
    """Collect all of the component parts of a split dds texture and return them as a dict where the keys are the
    filename and the value is the `P4KInfo` or `Path` of the part.

    :param from_list: Used to provide a sub-list of P4K members when searching the P4K for parts. It should be expected
        that the `from_list` does in fact contain the parts
    """
    if isinstance(dds_file, P4KInfo):
        dds_filename = Path(dds_file.filename)
        basename = (
            (dds_filename.parent / dds_filename.stem.split(".")[0])
            .with_suffix(".dds")
            .as_posix()
            .casefold()
        )
        if from_list:
            dds_files = {
                p.name: _
                for _ in from_list
                if (p := Path(_.filename)).as_posix().casefold().startswith(basename)
            }
        else:
            dds_files = {
                Path(_.filename).name: _ for _ in dds_file.p4k.search(basename, mode="startswith")
            }
    else:
        dds_filename = Path(dds_file)
        basename = dds_file.parent / dds_file.stem.split(".")[0]
        dds_files = {_.name: _ for _ in basename.parent.glob(f"{basename.name}.dds*")}

    if is_glossmap(dds_filename):
        dds_files = {k: v for k, v in dds_files.items() if k.endswith("a")}
    else:
        dds_files = {k: v for k, v in dds_files.items() if not k.endswith("a")}

    return dds_files


def collect_and_unsplit(
    dds_file: typing.Union[str, Path, P4KInfo], outfile="-", remove: bool = False
) -> typing.Union[bytes, Path]:
    """
    Automatically find associated pieces of a split DDS texture and return the recombined (un-split) texture.

    :param dds_file: The path to a piece of a split DDS texture, or the `P4KInfo` of a piece of a split DDS within a
        `p4k` archive.
    :param outfile: The output path for the unsplit texture. Defaults to '-' which will return the bytes of the texture
        instead of writing it to a file
    :param remove: Remove the collected pieces after unsplitting. Must specify an `outfile`, does nothing if '-'.
    :return: Bytes of the recombined texture if `outfile` is '-', otherwise the `Path` to the file that was created
    """
    dds_files = collect_parts(dds_file)
    outfile = unsplit_dds(dds_files, outfile=outfile)

    if isinstance(outfile, Path) and remove:
        if is_glossmap(outfile):
            [
                _.unlink(missing_ok=True)
                for _ in outfile.parent.glob(f'{outfile.name.split(".")[0]}.dds.[0-9]a')
            ]
        else:
            [
                _.unlink(missing_ok=True)
                for _ in outfile.parent.glob(f'{outfile.name.split(".")[0]}.dds.[0-9]')
            ]

    return outfile
