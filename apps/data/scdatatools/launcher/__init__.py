import os
import json
import typing
import logging
from json.decoder import JSONDecodeError
from pathlib import Path


logger = logging.getLogger(__name__)


def get_library_folder(rsilauncher_log_file: typing.Union[Path, str] = None) -> typing.Union[Path, None]:
    """
    Returns a `Path` to the Library Folder of the StarCitizen installation directory, or None if it could not be
    determined
    """
    if rsilauncher_log_file is None:
        app_dir = Path(os.path.expandvars(r"%APPDATA%\rsilauncher"))
        for l in [app_dir / "log.log", app_dir / "logs" / "log.log"]:
            if l.is_file():
                rsilauncher_log_file = l
                break
        else:
            return None
    if rsilauncher_log_file.is_file():
        for log in rsilauncher_log_file.open("r", encoding="utf-8", errors="surrogateescape").read().split("},\n{")[::-1]:
            try:
                log = '{' + log.strip().strip(',').lstrip('{') + "}"
                event = json.loads(log)
                if 'info' in event:
                    info_key = 'info'
                elif '[browser][info] ' in event:
                    info_key = '[browser][info] '
                else:
                    continue
                event_type = event.get(info_key, {}).get("event", "")
                library_folder = None
                if event_type == "INSTALLER@INSTALL":
                    library_folder = Path(event[info_key]['data']['gameInformation']['libraryFolder'])
                elif event_type == "CHANGE_LIBRARY_FOLDERS":
                    library_folder = Path(event[info_key]['data']['filePaths'][0])
                if (library_folder is not None and library_folder.is_dir() and
                        (library_folder / 'StarCitizen').is_dir()):
                    return library_folder
            except (KeyError, IndexError, JSONDecodeError, AttributeError) as e:
                pass

    # could not determine the library folder from the launcher log, try the default path
    default_dir = Path(os.path.expandvars(r"%PROGRAMFILES%\Roberts Space Industries"))
    if default_dir.is_dir() and (default_dir / 'StarCitizen').is_dir():
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
