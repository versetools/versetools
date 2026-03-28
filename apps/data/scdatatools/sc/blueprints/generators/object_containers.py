import logging
import typing
from pathlib import Path

from scdatatools.p4k import P4KInfo
from scdatatools.sc.blueprints.base import Blueprint
from scdatatools.sc.blueprints.processors.p4k.socpak import process_soc
from scdatatools.utils import norm_path

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from scdatatools import StarCitizen


def blueprint_from_socpak(
    sc: "StarCitizen",
    socpak: typing.Union[str, P4KInfo, Path],
    bp: Blueprint = None,
    container_name: str = "",
    bone_name: str = "",
    attrs: dict = None,
    monitor: typing.Callable = None,
) -> "Blueprint":
    """
    Generates a `Blueprint` which can be used to extract and import the assets defined within the given Object Container


    :param sc: `StarCitizen` instance to search for data.
    :param socpak: `str | Path` path, or the `P4KInfo` of the `.sockpak` in `sc.p4k`
    :param bp: Optionally add the `Object Container` to the given `Blueprint`, otherwise a new Blueprint will be
        created. When adding to a `Blueprint`, the prefab will be added to whatever the current `container` is selected
        for in the `Blueprint`
    :param container_name: Name of the container. If blank the name of the socpak will be used
    :param bone_name: Name of the attachment point for this `.socpak`
    :param attrs: `dict` of additional attributes to include in the `container` in the `Blueprint`
    :param monitor: The output log handling function Blueprint will use in addition to `logging`
    :return: `Blueprint`
    """
    if isinstance(socpak, P4KInfo):
        p4k_path = Path(socpak.filename)
    else:
        p4k_path = Path(socpak)

    name = container_name if container_name else p4k_path.stem
    attrs = attrs or {}
    attrs["socpak"] = p4k_path.as_posix()

    if bp is None:
        bp = Blueprint(name, sc, monitor=monitor)

    oc = bp.sc.oc_manager.load_socpak(f"{p4k_path.as_posix()}".lower())
    added_path = bp.add_file_to_extract(p4k_path, no_process=True)  # extract the socpak itself
    bp.add_file_to_extract([_.filename for _ in oc.socpak.filelist], no_process=True)

    bp.bone_names.add(bone_name.lower())
    # geom_attrs = {'bone_name': bone_name} if bone_name else {}
    geom_attrs = {}

    # we're processing it right away, so make sure we're not double processing it
    bp._processed_containers.add(added_path)

    with bp.set_current_container(name, attrs=attrs):
        for soc_name, soc in oc.socs.items():
            soc_path = norm_path(soc.soc_info.filename).lower()
            bp.current_container["socs"].append(soc_path)
            bp.add_file_to_extract(soc_path, no_process=True)
            process_soc(bp, soc, bone_name=bone_name, geom_attrs=geom_attrs)
        for child_guid, child in oc.children.items():
            try:
                blueprint_from_socpak(
                    sc,
                    socpak=child.name,
                    container_name=child.entity_name,
                    bp=bp,
                    bone_name=bone_name,
                    attrs={
                        "pos": child.position,
                        "rotation": child.rotation,
                    },
                )
            except Exception as e:
                #bp.log(f'Failed to load child container of {name}: {child["name"]} {e}')
                bp.log(f'Failed to load child container of {name}: {e}')
    return bp
