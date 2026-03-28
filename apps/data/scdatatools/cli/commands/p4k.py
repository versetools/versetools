import logging
import shutil
import sys
from pathlib import Path

from nubia import command, argument
from rich.progress import Progress

from . import common

logger = logging.getLogger(__name__)


@command(help="Utilities for interacting with p4k files.")
class p4k:
    @command(help="Extract files from a P4K file", aliases=["x"])
    @argument("single", description="Extract first matching file only", aliases=["-1"])
    @argument(
        "output",
        description="The output directory to extract files into or the output path if --single. "
        "Defaults to current directory",
        aliases=["-o"],
    )
    @argument(
        "file_filter",
        description="Posix style file filter of which files to extract. Defaults to '*'",
        aliases=["-f"],
    )
    @common.sc_dir_argument
    @common.extraction_args(exclude=["output"])
    def extract(
        self,
        sc_dir: str,
        output: str = ".",
        file_filter: str = "*",
        convert_cryxml: str = "",
        extract_model_assets: bool = False,
        unsplit_textures: bool = False,
        convert_textures: str = "",
        convert_models: bool = False,
        single: bool = False,
        no_overwrite: bool = False,
    ):
        output = Path(output).absolute()
        sc = common.open_sc_dir(sc_dir)
        file_filter = file_filter.strip("'").strip('"')

        try:
            p = sc.p4k
        except KeyboardInterrupt:
            sys.exit(0)

        unsplit_textures = unsplit_textures or convert_textures != ""

        converters = []
        converter_options = dict()
        if convert_cryxml:
            converter_options.update({"cryxml_converter_fmt": convert_cryxml})
            converters.append("cryxml_converter")
        if extract_model_assets:
            converters.append("model_assets_extractor")
        if unsplit_textures:
            converters.append("ddstexture_converter")
            converter_options.update(
                {
                    "ddstexture_converter_unsplit": True,
                    "ddstexture_converter_replace": not no_overwrite,
                }
            )
            if convert_textures:
                converter_options["ddstexture_converter_fmt"] = convert_textures
            else:
                converter_options["ddstexture_converter_fmt"] = "dds"
        if convert_models:
            converters.append("cgf_converter")
            # convert spaces in material names for dae conversion
            converter_options["cryxml_converter_mtl_fix_names"] = True

        if single:
            print(f"Extracting first match for filter '{file_filter}' to {output}")
            print("=" * 80)
            found_files = p.search(file_filter)
            if not found_files:
                sys.stderr.write(f"No files found for filter")
                sys.exit(2)
            extract_file = found_files[0]

            print(f"Extracting {extract_file.filename}")

            if output.name:
                # given an output name - use it instead of the name in the P4K
                output.parent.mkdir(parents=True, exist_ok=True)
                with p.open(extract_file) as source, open(str(output), "wb") as target:
                    shutil.copyfileobj(source, target)
            else:
                output.mkdir(parents=True, exist_ok=True)
                p.extract(extract_file, path=str(output), converters=converters)

        else:
            print(f"Extracting files into {output} with filter '{file_filter}'")
            print("=" * 80)
            output.mkdir(parents=True, exist_ok=True)
            try:
                with Progress() as progbar:
                    extracting_task = progbar.add_task("Extracting files", total=None)

                    def log(msg, progress=None, total=None, level=None, exc_info=None):
                        level = level or logging.INFO
                        logger.log(level, msg, exc_info=exc_info)
                        progbar.update(extracting_task, total=total, completed=progress)

                    p.extract_filter(
                        file_filter=file_filter,
                        path=str(output),
                        converters=converters,
                        converter_options=converter_options,
                        overwrite=not no_overwrite,
                        monitor=log,
                    )
            except KeyboardInterrupt:
                pass
