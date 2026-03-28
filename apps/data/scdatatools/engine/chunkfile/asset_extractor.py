import typing
from pathlib import Path

from scdatatools import plugins
from scdatatools.engine.chunkfile.converter import CGF_CONVERTER_MODEL_EXTS
from scdatatools.p4k import P4KInfo
from scdatatools.sc import StarCitizen
from scdatatools.sc.blueprints import Blueprint


@plugins.register
class ModelAssetsExtractor(plugins.P4KConverterPlugin):
    name = "model_assets_extractor"
    display_name = "Model Assets Extractor"
    handles = CGF_CONVERTER_MODEL_EXTS
    converter_hook_kwargs = {
        "priority": 10  # makes sure this plugin gets run before other converts (default is 100)
    }

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
        """For each model, this will also select all the associated assets with that model and select them for
        extraction (e.g. mtls and textures referenced by those mtls). This will happen before other converters so the
        selected assets will be converted as well.
        """
        members_to_extract = set()

        # make sure we catch the `m` versions of files too
        handled_exts = set(cls.handles + [f"{_}m" for _ in cls.handles])

        # create a temporary Blueprint to handle doing all the processing for us
        p4k = members[0].p4k
        sc = StarCitizen(Path(p4k.filename).parent)
        sc.p4k = p4k
        bp = Blueprint("temp", sc)

        while members:
            member = members.pop()
            ext = member.filename.split(".", maxsplit=1)[-1].casefold()

            members_to_extract.add(member)
            if ext in handled_exts:
                bp.add_file_to_extract(member.filename)

        bp_files_to_extract = set(
            sc.p4k.search(bp.extract_filter, ignore_case=True, mode="in_strip")
        )
        return list(members_to_extract | bp_files_to_extract), []
