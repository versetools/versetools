import logging
import sys
import typing
from functools import partial
from pathlib import Path

from nubia import command, argument
from rich.progress import Progress

from scdatatools.sc.blueprints.generators.datacore_entity import blueprint_from_datacore_entity
from . import common

logger = logging.getLogger(__name__)


def resolve_blueprint(sc, entity):
    if record := sc.datacore.records_by_guid.get(entity):
        return record
    search = entity if entity.casefold().endswith(".xml") else entity + ".xml"
    records = [
        record
        for record in sc.datacore.search_filename(f"*/{search}")
        if record.type == "EntityClassDefinition"
    ]
    if len(records) > 1:
        logger.debug(f"{records =}")
        logger.error(f'"{entity}" is too ambiguous')
        sys.exit(1)
    elif records:
        return records[0]
    logger.error(f'Could not find entity for "{entity}"')
    sys.exit(1)


@command(aliases=["bp"])
class blueprint:
    """Generate and extract STar Citizen Blueprint (scbp)."""

    @command()
    @common.sc_dir_argument
    @argument(
        "entity",
        description="The Data Core entity record to generate a blueprint for.",
        positional=True,
    )
    @argument(
        "output",
        aliases=["-o"],
        description="The output path to write the blueprint. Defaults to `entity_name.scbp` in the current directory. "
        'Use "-" to print the blueprint to stdout',
    )
    def generate(
        self,
        sc_dir: str,
        entity: str,
        output: str = "",
    ):
        """Generate a scbp"""
        sc = common.open_sc_dir(sc_dir)
        entity = resolve_blueprint(sc, entity)
        logger.info(f"Generating blueprint for {entity.name} ({entity.id})")
        with Progress() as progbar:
            generating_bp = progbar.add_task("Generating blueprint", total=None)

            def log(msg, progress, total, level, exc_info):
                logger.log(level, msg, exc_info=exc_info)
                progbar.update(generating_bp, total=total, completed=progress)

            bp = blueprint_from_datacore_entity(sc, entity, monitor=log)

            if not output:
                output = f"{bp.name}.scbp"

            if output == "-":
                print(bp.dumps())
            else:
                logger.info(f"writing blueprint to {output}")
                with open(output, "w") as o:
                    bp.dump(o)

    @command()
    @common.sc_dir_argument
    @argument(
        "entity_or_blueprint",
        description="The Data Core entity record to extract, or scbp file.",
        positional=True,
    )
    @argument("output", description="Output directory to extract data into", positional=True)
    @common.extraction_args(exclude=["extract_model_assets", "output"])
    def extract(
        self,
        sc_dir: str,
        entity_or_blueprint: str,
        output: typing.Text,
        convert_cryxml: typing.Text = "xml",
        unsplit_textures: bool = True,
        convert_textures: str = "",
        convert_models: bool = False,
        no_overwrite: bool = False,
    ):
        """Extract all the record assets for a given blueprint, optionally also generating the blueprint."""
        sc = common.open_sc_dir(sc_dir)

        with Progress() as progbar:

            def log(task, msg, progress=None, total=None, level=None, exc_info=None):
                level = level or logging.INFO
                logger.log(level, msg, exc_info=exc_info)
                progbar.update(task, total=total, completed=progress)

            output = Path(output)
            output.mkdir(parents=True, exist_ok=True)

            generating_bp = progbar.add_task("Generating blueprint", total=None)
            if (bp := Path(entity_or_blueprint)).is_file():
                print(f"TODO: handle already generated blueprints")
                sys.exit(1)
            else:
                entity = resolve_blueprint(sc, entity_or_blueprint)
                logger.info(f"Generating blueprint for {entity.name} ({entity.id})")

                bp = blueprint_from_datacore_entity(sc, entity, monitor=partial(log, generating_bp))
                with open(output / f"{bp.name}.scbp", "w") as o:
                    bp.dump(o)

            opts = {
                "convert_cryxml_fmt": convert_cryxml,
                "auto_unsplit_textures": unsplit_textures,
                "auto_convert_textures": bool(convert_textures),
                "convert_dds_fmt": convert_textures,
                "extract_sounds": True,
                "auto_convert_models": convert_models,
            }
            progbar.reset(generating_bp, description=f"Exporting {bp.name}")
            bp.extract(outdir=output, monitor=partial(log, generating_bp), **opts)
