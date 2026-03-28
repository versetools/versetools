import logging
import sys
import typing
from collections import OrderedDict
from pathlib import Path

from nubia import context
from nubia.internal.typing import _ArgDecoratorSpec, _init_attr

from scdatatools.launcher import get_installed_sc_versions
from scdatatools.sc import StarCitizen

if typing.TYPE_CHECKING:
    from ..plugin import SCDTContext


logger = logging.getLogger(__name__)


def get_context() -> "SCDTContext":
    return context.get_context()


def open_sc_dir(sc_dir: typing.Union[str, Path]) -> StarCitizen:
    """Processes the `sc_dir` CLI argument and returns a `StarCitizen` object. This function will error and exit the
    program if it fails to open the given `sc_dir`.
    """
    installed_versions = get_installed_sc_versions()
    if str(sc_dir).upper() in installed_versions and not Path(sc_dir).is_dir():
        sc_dir = installed_versions[sc_dir.upper()]
        logger.debug(f"Using installed version {sc_dir}")

    ctx = get_context()
    sc_dir = Path(sc_dir).expanduser()
    if sc_dir.is_file():
        if sc_dir.suffix == ".p4k":
            sc_dir = sc_dir.parent
        else:
            sys.stderr.write(
                f"Invalid argument for sc_dir. Must be a Star Citizen installation directory or a Data.p4k file\n"
            )
            sys.exit(1)

    try:
        sc = StarCitizen(sc_dir, cache_dir=ctx.cache_dir)
    except Exception as e:
        sys.stderr.write(f"Unable to open StarCitizen data: {e}\n")
        sys.exit(1)
    return sc


def sc_dir_argument(function):
    """Adds a 'sc_data_folder' argument for the given function on the CLI. The function does not need to handle this
    argument and should access the selected nodes through the context
    """
    _init_attr(function, "__annotations__", OrderedDict())
    _init_attr(function, "__arguments_decorator_specs", {})
    function.__annotations__.setdefault("sc_dir", str)
    function.__arguments_decorator_specs["sc_dir"] = _ArgDecoratorSpec(
        arg="sc_dir",
        name="sc_dir",
        description="Star Citizen installation directory or Data.p4k file. You can also specify LIVE or PTU and scdt "
        "will attempt to find the installed versions of Star Citizen.",
        aliases=[],
        positional=True,
        choices=[],
    )
    return function


EXTRACTION_ARGS = {
    "convert_cryxml": {
        "type": str,
        "description": "Automatically convert CryXmlB files to specified format.",
        "choices": ["xml", "json"],
        "aliases": ["-c"],
    },
    "extract_model_assets": {
        "type": bool,
        "description": "Automatically select and extract assets (materials and textures) for model files "
        "that are being extracted, in addition to the search filter",
        "aliases": ["-A"],
    },
    "unsplit_textures": {
        "type": bool,
        "description": "Automatically recombine split .dds texture files",
        "aliases": ["-T"],
    },
    "convert_textures": {
        "type": str,
        "aliases": ["-t"],
        "description": "Convert textures to the given image format. This also enables unsplit_textures.",
        "choices": ["png", "tif", "tga"],
    },
    "convert_models": {
        "type": bool,
        "description": "Automatically convert 3d models to COLLADA.",
        "aliases": ["-m"],
    },
    "no_overwrite": {
        "type": bool,
        "description": "Do not overwrite existing files.",
        "aliases": ["-O"],
    },
    "output": {
        "type": str,
        "description": "The output directory to extract files into or the output path if --single. "
        "Defaults to current directory",
        "aliases": ["-o"],
    },
}


def extraction_args(exclude=None):
    """Adds p4k extraction options for the given function on the CLI."""
    excluded_args = exclude or []

    def wrap(function):
        _init_attr(function, "__annotations__", OrderedDict())
        _init_attr(function, "__arguments_decorator_specs", {})

        for arg_name, params in EXTRACTION_ARGS.items():
            if arg_name in excluded_args:
                continue
            function.__annotations__.setdefault(arg_name, params["type"])
            function.__arguments_decorator_specs[arg_name] = _ArgDecoratorSpec(
                arg=arg_name,
                name=arg_name,
                positional=params.get("positional", False),
                description=params["description"],
                aliases=params.get("aliases", []),
                choices=params.get("choices", []),
            )
        return function

    if exclude is not None and not isinstance(exclude, list):
        return wrap(exclude)
    return wrap
