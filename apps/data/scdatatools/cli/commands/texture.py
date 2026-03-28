import os
import shutil
import sys
import typing
from pathlib import Path

from nubia import command, argument

from scdatatools.engine.textures import (
    collect_and_unsplit,
    tex_convert,
    ConverterUtility,
)
from scdatatools.engine.textures.dds import is_glossmap
from scdatatools.utils import NamedBytesIO


@command
class Tex:
    """Texture processing commands"""

    @command(
        help="Recombine split DDS texture files (dds.N). This will attempt to locate the DDS pieces."
    )
    @argument(
        "dds_files",
        description="DDS file to recombine. Split pieces will be found automatically. Directories "
        "will be searched recursively for split textures.",
        positional=True,
    )
    @argument(
        "outdir",
        aliases=["-o"],
        description="Output directory to place unsplit textures. By default, the output texture will be placed next to"
        "the input texture with '_full' appended to it's filename, or be replaced if -r is specified",
    )
    @argument("quiet", aliases=["-q"], description="Only print errors")
    @argument(
        "replace",
        aliases=["-r"],
        description="Replace the DDS file and also remove the pieces. Only if not output directory is specified",
    )
    def dds_unsplit(
        self,
        dds_files: typing.List[str],
        outdir: str = "",
        quiet=False,
        replace: bool = False,
    ):
        files_to_process = set()
        for ddsfile in dds_files:
            ddsfile = Path(ddsfile).absolute()
            if ddsfile.is_dir():
                for dds in ddsfile.rglob("*.dds.[0-9]*"):
                    if is_glossmap(dds):
                        files_to_process.add(dds.parent / f'{dds.name.split(".")[0]}.dds.a')
                    else:
                        files_to_process.add(dds.parent / f'{dds.name.split(".")[0]}.dds')
            else:
                _ = Path(ddsfile)
                if is_glossmap(ddsfile):
                    files_to_process.add(_.parent / f'{_.name.split(".")[0]}.dds.a')
                else:
                    files_to_process.add(_.parent / f'{_.name.split(".")[0]}.dds')

        if outdir:
            outdir = Path(outdir).absolute()

        for ddsfile in files_to_process:
            try:
                if outdir:
                    outfile = outdir / f"{Path(ddsfile).name}"
                elif replace:
                    outfile = ddsfile
                else:
                    stem, ext = str(ddsfile.name).split(".", maxsplit=1)
                    outfile = (ddsfile.parent / f"{stem}_full.{ext}").absolute()

                outfile = collect_and_unsplit(ddsfile, outfile=outfile, remove=replace)
                if not quiet:
                    print(f"{ddsfile} -> {outfile}")
            except KeyboardInterrupt:
                break
            except Exception as e:
                sys.stderr.write(f"Failed to convert {ddsfile}: {repr(e)}\n")
                sys.stderr.flush()

    @command(help="Convert DDS textures to another format.")
    @argument(
        "dds_files",
        description="DDS file to converter. Split pieces will be found automatically. Directories "
        "will be searched recursively for split textures.",
        positional=True,
    )
    @argument(
        "outdir",
        aliases=["-o"],
        description="Output directory to place converted textures. By default, the output texture will be placed next "
        "to the input texture with the output extension.",
    )
    @argument(
        "output_format",
        aliases=["png"],
        description="The output format to convert to (Defaults to png)",
    )
    @argument(
        "converter",
        aliases=["-c"],
        description="Path to the converter (texconv or compressonatorcli) to use",
    )
    @argument("quiet", aliases=["-q"], description="Only print errors")
    def convert(
        self,
        dds_files: typing.List[str],
        output_format: str = "png",
        outdir: str = "",
        converter: str = "texconv",
        quiet=False,
    ):
        converter_bin = converter
        if not os.path.isfile(converter_bin):
            converter_bin = shutil.which(converter_bin)
        if not os.path.isfile(converter_bin):
            sys.stderr.write(
                f"Could not determine which image converter to use. texconv or compressonatorcli is "
                f"required"
            )
            sys.exit(1)

        if "texconv" in str(converter_bin).lower():
            converter = ConverterUtility.texconv
        else:
            converter = ConverterUtility.compressonator

        output_format = "." + output_format.lstrip(".").lower()
        files_to_process = set()
        for ddsfile in dds_files:
            ddsfile = Path(ddsfile).absolute()
            if ddsfile.is_dir():
                for dds in ddsfile.rglob("*.dds.[0-9]*"):
                    if is_glossmap(dds):
                        files_to_process.add(dds.parent / f'{dds.name.split(".")[0]}.dds.a')
                    else:
                        files_to_process.add(dds.parent / f'{dds.name.split(".")[0]}.dds')
            else:
                _ = Path(ddsfile)
                if is_glossmap(ddsfile):
                    files_to_process.add(_.parent / f'{_.name.split(".")[0]}.dds.a')
                else:
                    files_to_process.add(_.parent / f'{_.name.split(".")[0]}.dds')

        if outdir:
            outdir = Path(outdir).absolute()

        for ddsfile in files_to_process:
            try:
                if outdir:
                    outfile = outdir / f"{Path(ddsfile).stem}{output_format}"
                else:
                    outfile = Path(ddsfile).with_suffix(output_format).absolute()

                tex_convert(
                    NamedBytesIO(collect_and_unsplit(ddsfile), str(ddsfile)),
                    outfile,
                    converter=converter,
                    converter_bin=converter_bin,
                )
                if not quiet:
                    print(f"{ddsfile} -> {outfile}")
            except KeyboardInterrupt:
                break
            except Exception as e:
                sys.stderr.write(f"Failed to convert {ddsfile}: {repr(e)}\n")
                sys.stderr.flush()
