import logging
import os
from pathlib import Path

import sentry_sdk

from .utils import install_blender_addon, reload_scdt_blender_modules
from .. import logging as blender_logging

try:
    import bpy
except ImportError:
    # Not inside of blender, ignore the blender modules
    modules = []
else:
    from scdatatools.plugins import plugin_manager
    from scdatatools.blender import blueprints, materials

    from . import preferences, header_menu

    modules = [blueprints, materials]


logger = logging.getLogger(__name__)


ADDON_TEMPLATE = """
# SC Data Tools Add-on
# https://gitlab.com/scmodding/frameworks/scdatatools

import sys
import bpy

paths = {path}
sys.path.extend(_ for _ in paths if _ not in sys.path)

bl_info = {{
    "name": "Star Citizen Data Tools",
    "author": "ventorvar",
    "version": (0, 1, 0),
    "blender": (3, 1, 0),
    "location": "View3D > Panel",
    "category": "SC Modding",
    "doc_url": "https://gitlab.com/scmodding/frameworks/scdatatools",
}}

from scdatatools.blender.addon import *
"""


def install(version) -> Path:
    """Installs the scdatatools add-on into the Blender version `version`."""
    return install_blender_addon(version, "scdt_addon", ADDON_TEMPLATE)


def register():
    if not modules:
        return

    reload_scdt_blender_modules()

    try:
        sentry_sdk.set_tag("blender.version", bpy.app.version_string)
    except (AttributeError, ValueError):
        sentry_sdk.set_tag("blender.version", "unknown")

    if (pycharm_debug_port := int(os.environ.get("SCDT_PYCHARM_DEBUG", 0))) > 0:
        try:
            print(f"Connecting to pycharm debug on {pycharm_debug_port}")

            import pydevd_pycharm

            pydevd_pycharm.settrace(
                "localhost",
                port=pycharm_debug_port,
                stdoutToServer=True,
                stderrToServer=True,
            )
        except Exception as e:
            print(f"Could not connect to pycharm debugger: {repr(e)}")
    if (vscode_debug_port := int(os.environ.get("SCDT_VSCODE_DEBUG", 0))) > 0:
        try:
            import debugpy

            print(f"Connecting to vscode debug on {vscode_debug_port}")
            debugpy.listen(("localhost", vscode_debug_port))
            print("Waiting for client to attach")
            debugpy.wait_for_client()
        except Exception as e:
            print(f"Could not connect to vscode debugger: {repr(e)}")

    blender_logging.setup_addon_logging()
    plugin_manager.setup()

    for module in modules:
        module.register()

    preferences.register()
    header_menu.add_modding_menu()


def unregister():
    if not modules:
        return

    for module in modules:
        module.unregister()

    preferences.unregister()
    header_menu.remove_modding_menu()

    blender_logging.remove_addon_logging()
