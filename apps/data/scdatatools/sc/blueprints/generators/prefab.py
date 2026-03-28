import logging
import typing

from scdatatools.engine.model_utils import vector_from_csv, quaternion_from_csv
from scdatatools.sc.blueprints.base import Blueprint

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from scdatatools import StarCitizen
    from scdatatools.p4k import P4KInfo
    from scdatatools.engine.prefabs import PrefabLibrary, Prefab


def blueprint_from_prefab(
    prefab: "Prefab", bp: Blueprint = None, monitor: typing.Callable = None
) -> "Blueprint":
    """
    Generates a `Blueprint` which can be used to extract and import the assets defined within the given `Prefab`

    :param prefab: `Prefab` to create the `Blueprint` from.
    :param bp: Optionally add the `Prefab` to the given `Blueprint`, otherwise a new Blueprint will be created. When
        adding to a `Blueprint`, the prefab will be added to whatever the current `container` is selected for in the
        `Blueprint`
    :param monitor: The output log handling function Blueprint will use in addition to `logging`
    :return: `Blueprint`
    """
    if bp is None:
        bp = Blueprint(prefab.name, prefab.manager.sc, monitor=monitor)

    with bp.set_current_container(prefab.name):
        for obj in prefab.objects_with_geometry():
            try:
                geom, _ = bp.get_or_create_geom(obj["object"]["geometry"])
                geom.add_instance(
                    name=obj["object"]["name"],
                    pos=obj["pos_offset"] + vector_from_csv(obj["object"].get("pos", "0,0,0")),
                    rotation=obj["rotation_offset"]
                    * quaternion_from_csv(obj["object"].get("rotate", "1,1,1,1")),
                    scale=vector_from_csv(obj["object"].get("scale", "1,1,1")),
                )
            except Exception as e:
                logger.exception(
                    f'Error getting geometry for {obj["object"]["name"]} in {prefab.name}',
                    exc_info=e,
                )
    return bp


def blueprint_from_prefab_library(
    prefab_library: "PrefabLibrary",
    bp: Blueprint = None,
    monitor: typing.Callable = None,
) -> "Blueprint":
    """
    Generates a `Blueprint` which can be used to extract and import the assets defined within the given `PrefabLibrary`.
    Each `Prefab` within the `PrefabLibrary` will be added as a separate container.

    :param prefab_library: `PrefabLibrary`
    :param bp: Optionally add the `Prefab` to the given `Blueprint`, otherwise a new Blueprint will be created. When
        adding to a `Blueprint`, the prefab will be added to whatever the current `container` is selected for in the
        `Blueprint`
    :param monitor: The output log handling function Blueprint will use in addition to `logging`
    :return: `Blueprint`
    """
    if bp is None:
        bp = Blueprint(prefab_library.name, prefab_library.manager.sc, monitor=monitor)
    for prefab in prefab_library.prefabs.values():
        blueprint_from_prefab(prefab, bp, monitor)
    return bp


def blueprint_from_prefab_xml(
    sc: "StarCitizen",
    prefab_xml: typing.Union[str, "P4KInfo"],
    bp: Blueprint = None,
    monitor: typing.Callable = None,
) -> "Blueprint":
    """
    Generates a `Blueprint` which can be used to extract and import the assets defined within the given prefab xml.
    The prefab xml will be loaded with the given `sc` prefab_manager.

    :param sc: `StarCitizen` instance to search for data.
    :param prefab_xml: name (path) or P4KInfo of a prefab xml in a P4K
    :param bp: Optionally add the `Prefab` to the given `Blueprint`, otherwise a new Blueprint will be created. When
        adding to a `Blueprint`, the prefab will be added to whatever the current `container` is selected for in the
        `Blueprint`
    :param monitor: The output log handling function Blueprint will use in addition to `logging`
    :return: `Blueprint`
    """
    try:
        # allow to specify by name
        prefab_library = sc.prefab_manager.library_from_name(prefab_xml)
    except (AttributeError, KeyError):
        prefab_library = sc.prefab_manager.load_prefab_library(prefab_xml)
    return blueprint_from_prefab_library(prefab_library, bp, monitor)
