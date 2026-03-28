import os
import json
import typing
import logging
from json.decoder import JSONDecodeError
from pathlib import Path
from sys import platform

logger = logging.getLogger(__name__)


def get_library_folder(rsilauncher_log_file: typing.Union[Path, str] = None) -> typing.Union[Path, None]:
    """
    Returns a `Path` to the Library Folder of the StarCitizen installation directory, or None if it could not be
    determined
    """
    if platform == "linux":
        # Assume installed with lug-helper script: https://github.com/starcitizen-lug/lug-helper/tree/main
        gamedir_conf_path = Path(os.path.expandvars(r"$HOME/.config/starcitizen-lug/gamedir.conf"))
        if gamedir_conf_path.is_file():
            # This will give us the path of the game's "StarCitizen" dir directly, and though naive should work for most
            # of the Linux community outside of users who just install the launcher using their system Wine.
            with open(gamedir_conf_path, "r", encoding="utf-8") as f:
                sc_dir = Path(f.read().rstrip())
                lib_dir = sc_dir.parent if sc_dir.is_dir() else None
                if lib_dir is not None and lib_dir.is_dir() and (lib_dir / "StarCitizen").is_dir():
                    return lib_dir
        else:
            if rsilauncher_log_file is None:  # Oh no :(
                # Check lug-helper Wine and system Wine paths
                # TODO: This needs to be made a bit more robust, as it currently hard errors out if it's not found.
                winedir_conf_path = Path(os.path.expandvars(r"$HOME/.config/starcitizen-lug/winedir.conf"))
                if winedir_conf_path.is_file():  # lug-helper
                    wine_dir = Path(winedir_conf_path.open("r", encoding="utf-8").read().rstrip())
                else:  # System wine
                    wine_dir = Path(os.path.expandvars(r"$HOME/.wine"))

                if wine_dir.is_dir():
                    drive_c_dir = wine_dir / "dosdevices" / "c:"
                    user = os.getenv("USER")
                    if drive_c_dir.is_dir() and user is not None:
                        rsilauncher_appdata = drive_c_dir / "users" / user / "AppData" / "Roaming" / "rsilauncher"
                        if rsilauncher_appdata.is_dir():
                            for l in [rsilauncher_appdata / "log.log", rsilauncher_appdata / "logs" / "log.log"]:
                                if l.is_file():
                                    rsilauncher_log_file = l
                                    break
                            else:
                                return None

    elif platform == "win32":
        if rsilauncher_log_file is None:
            app_dir = Path(os.path.expandvars(r"%APPDATA%\rsilauncher"))
            for l in [app_dir / "log.log", app_dir / "logs" / "log.log"]:
                if l.is_file():
                    rsilauncher_log_file = l
                    break
            else:
                return None
    else:  # No other platforms supported
        return None

    if rsilauncher_log_file is not None and rsilauncher_log_file.is_file():
        for log in (
            rsilauncher_log_file.open("r", encoding="utf-8", errors="surrogateescape").read().split("},\n{")[::-1]
        ):
            try:
                log = "{" + log.strip().strip(",").lstrip("{") + "}"
                event = json.loads(log)
                if "info" in event:
                    info_key = "info"
                elif "[browser][info] " in event:
                    info_key = "[browser][info] "
                else:
                    continue
                event_type = event.get(info_key, {}).get("event", "")
                lib_dir_str = None
                if event_type == "INSTALLER@INSTALL":
                    lib_dir_str = event[info_key]["data"]["gameInformation"]["libraryFolder"]
                elif event_type == "CHANGE_LIBRARY_FOLDERS":
                    lib_dir_str = event[info_key]["data"]["filePaths"][0]

                library_folder = None
                # Handle path transformations
                if lib_dir_str is not None:
                    if platform == "linux":
                        drive_letter = lib_dir_str[:2]
                        library_folder = wine_dir / "dosdevices" / drive_letter.lower() / lib_dir_str[:4].split("//")
                    elif platform == "win32":
                        library_folder = Path(lib_dir_str)

                if library_folder is not None and library_folder.is_dir() and (library_folder / "StarCitizen").is_dir():
                    return library_folder
            except (KeyError, IndexError, JSONDecodeError, AttributeError):
                pass

    # could not determine the library folder from the launcher log, try the default path
    default_dir = None
    if platform == "linux":
        default_dir = drive_c_dir / "Program Files" / "Roberts Space Industries"
    elif platform == "win32":
        default_dir = Path(os.path.expandvars(r"%PROGRAMFILES%\Roberts Space Industries"))
    if default_dir is not None and default_dir.is_dir() and (default_dir / "StarCitizen").is_dir():
        return default_dir
    return None


def get_installed_sc_versions() -> typing.Dict[str, Path]:
    """Returns a dictionary of the currently available installations of Star Citizen"""
    vers = {}
    lib_folder = get_library_folder()
    if lib_folder is None:
        return vers

    if (lib_folder / "StarCitizen" / "LIVE" / "Data.p4k").is_file():
        vers["LIVE"] = lib_folder / "StarCitizen" / "LIVE"

    if (lib_folder / "StarCitizen" / "PTU" / "Data.p4k").is_file():
        vers["PTU"] = lib_folder / "StarCitizen" / "PTU"

    return vers
