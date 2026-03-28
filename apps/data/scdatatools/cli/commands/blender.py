import typing
from pathlib import Path

from nubia import command, argument

from scdatatools.blender.addon import install
from scdatatools.blender.utils import available_blender_installations


@command
class Blender:
    """Blender Integration"""

    @command
    @argument(
        "version",
        aliases=["-i"],
        description="Blender version to install the add-on to. Absolute path, or Blender version number if "
        "installed to the default location",
    )
    @argument(
        "include_path",
        aliases=["-p"],
        description="Add additional locations to look for blender.exe",
    )
    @argument(
        "list_versions",
        aliases=["-l"],
        description="List detected Blender installations.",
    )
    def install_addon(
        self,
        version: typing.List[str] = None,
        list_versions: bool = False,
        include_path: typing.List[str] = tuple(),
    ):
        """Install the current scdatatools add-on into Blender."""
        include_path = [Path(_) for _ in include_path]

        if list_versions:
            print(
                "\n".join(
                    f' {v["version"]}:\t{v["path"]}'
                    for k, v in available_blender_installations(include_paths=include_path).items()
                    if v["compatible"]
                )
            )
            return

        if version is None:
            version = set(
                _["version"]
                for _ in available_blender_installations(include_paths=include_path).values()
            )

        for v in version:
            print(f"Installed add-on to {str(install(v))}")
