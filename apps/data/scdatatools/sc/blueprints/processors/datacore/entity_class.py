import logging
import typing

from pyquaternion import Quaternion

from scdatatools.engine.cryxml import dict_from_cryxml_file
from scdatatools.engine.model_utils import Vector3D, ang3_to_quaternion
from scdatatools.forge.dftypes import Record
from scdatatools.sc.blueprints.processors import datacore_type_processor
from scdatatools.sc.blueprints.processors import process_datacore_object
from scdatatools.utils import norm_path, dict_search

if typing.TYPE_CHECKING:
    from scdatatools.forge.dco.entities import Entity
    from scdatatools.forge.dftypes import Record
    from scdatatools.sc.blueprints import Blueprint

logger = logging.getLogger(__name__)

RECORD_KEYS_WITH_PATHS = [
    # all keys are lowercase to ignore case while matching
    "@file",  # @File mtl
    "@path",  # @Path/@path chrparams, entxml, soc_cryxml, mtl
    "@texture",  # soc_cryxml
    "@cubemaptexture",  # @cubemapTexture soc_cryxml
    "@externallayerfilepath",  # @externalLayerFilePath soc_cryxml
    "animationdatabase",  # AnimationDatabase Ship Entity record in 'SAnimationControllerParams'
    "animationcontroller",  # AnimationController Ship Entity record in 'SAnimationControllerParams'
    "voxeldatafile",  # voxelDataFile Ship Entity record in 'SVehiclePhysicsGridParams'
]
RECORD_KEYS_WITH_AUDIO = ["audioTrigger"]
COMPONENT_PROCESS_PRIORITY = [
    "SGeometryResourceParams",
    "SItemPortContainerComponentParams",
    "SEntityComponentDefaultLoadoutParams",
    "VehicleComponentParams",
]


def _search_record(bp, record):
    """This is a brute-force method of extracting related files from a datacore record. It does no additional
    processing of the record, if there is specific data that should be extracted a different method should be
    implemented and used for that record type."""
    d = bp.sc.datacore.record_to_dict(record)
    bp.add_file_to_extract(dict_search(d, RECORD_KEYS_WITH_PATHS, ignore_case=True))


@datacore_type_processor("SGeometryResourceParams")
def process_geometry_resource_params(
        bp: "Blueprint", component, record: "Record", tags="", *args, **kwargs
) -> bool:
    if component.name == "SGeometryDataParams":
        mtl = component.properties["Material"].properties["path"]
        geom_path = component.properties["Geometry"].properties["path"]
        if mtl == 'objects/vfx/mesheffects/particle_transparent_meshes/fx_transparent_material.mtl':
            geom_path = ''
        else:
            bp.add_file_to_extract(mtl)
            attrs = {"tags": tags}

        if geom_path:
            if bp.entity is not None and record.id.value == bp.entity.id.value:
                # Setting pos to a non None for the primary guid will create the base instance
                geom, created = bp.get_or_create_geom(
                    geom_path,
                    create_params={
                        "attrs": attrs,
                        "pos": Vector3D(),
                        "materials": mtl,
                    },
                )
                bp.entity_geom = geom["name"]
            else:
                geom, created = bp.get_or_create_geom(
                    geom_path,
                    create_params={
                        "attrs": attrs,
                        "materials": mtl,
                    },
                )

            if geom is not None:
                bp.record_geometry.setdefault(str(record.id), {}).setdefault(tags, set()).add(
                    geom["name"]
                )
            else:
                bp.log(f'Could not create geom "{geom_path}', logging.ERROR)

            try:
                tint_id = str(component.properties["Palette"].properties["RootRecord"])
                if tint_id != "00000000-0000-0000-0000-000000000000":
                    palette = bp.sc.datacore.records_by_guid[tint_id]
                    geom["tint_palettes"].add(norm_path(palette.filename))
                    bp.add_record_to_extract(tint_id)
                    bp.add_file_to_extract(palette.properties["root"].properties["decalTexture"])
            except Exception as e:
                bp.log(f'could not dump tint for "{geom_path}"', exc_info=e)

    if "Geometry" in component.properties:
        process_geometry_resource_params(
            bp,
            component.properties["Geometry"],
            record=record,
            tags=component.properties.get("Tags", ""),
        )
    if "SubGeometry" in component.properties:
        for sg in component.properties.get("SubGeometry", []):
            process_geometry_resource_params(
                bp, sg, record=record, tags=component.properties.get("Tags", "")
            )
    if "Material" in component.properties:
        process_geometry_resource_params(bp, component.properties["Material"], record=record)
    if "path" in component.properties:
        bp.add_file_to_extract(component.properties["path"])

    return True


def load_item_port(bp: "Blueprint", item_port_name: str, record: Record, parent_geometry=None, parent_loadout=None):
    if parent_geometry is None:
        if not bp.entity:
            raise ValueError(f'Must specify parent_geometry or have a bp.entity set')
        parent_geometry = bp.geometry[bp.entity_geom]

    if parent_loadout is None:
        parent_loadout = parent_geometry['loadout']

    bp.add_record_to_extract(record.id)

    def _geom_for_port(port):
        ipe_geom = bp.geometry_for_record(record)
        for tag in ipe_geom:
            if tag and tag.lower() in port.lower():
                return ipe_geom[tag]
        return ipe_geom.get("", [])

    if item_port_name in parent_geometry["helpers"]:
        helper = parent_geometry["helpers"][item_port_name]
        for geom_path in _geom_for_port(helper["name"]):
            bp.get_or_create_geom(
                geom_path,
                parent=parent_geometry,
                create_params={
                    "pos": helper["pos"],
                    "rotation": helper["rotation"],
                    "attrs": {"bone_name": helper["name"].lower()},
                },
            )
        bp.bone_names.add(helper["name"].lower())
    else:
        # assign record to be instanced at the set itemPortName
        item_port_name = item_port_name.lower()
        item_port = bp.get_or_create_item_port(item_port_name, parent=parent_loadout)
        item_port["geometry"].update(_geom_for_port(item_port_name))
        bp.bone_names.add(item_port_name)
        return item_port


@datacore_type_processor("SEntityComponentDefaultLoadoutParams")
def process_component_loadouts(
        bp: "Blueprint", component, record: "Record", parent_loadout=None, *args, **kwargs
) -> bool:
    geom_path = bp.geometry_for_record(record, base=True)
    parent_geom, _ = bp.get_or_create_geom(geom_path)
    if parent_geom is None:
        raise ValueError(
            f"Could not determine parent geometry for loadout component of {record.filename}"
        )
    if parent_loadout is None:
        parent_loadout = parent_geom["loadout"]
    try:
        for entry in component.properties["loadout"].properties.get("entries", []):
            try:
                if not entry.properties["entityClassName"]:
                    continue

                if entry.properties["entityClassName"] not in bp.sc.datacore.entities:
                    bp.log(
                        f'Could not find entity in Datacore: {entry.properties["entityClassName"]}',
                        logging.WARNING,
                    )
                    continue

                item_port_entity = bp.sc.datacore.entities[entry.properties["entityClassName"]]
                port_name = entry.properties["itemPortName"]

                item_port = load_item_port(bp=bp, item_port_name=port_name, record=item_port_entity,
                                           parent_geometry=parent_geom, parent_loadout=parent_loadout)
                if item_port is not None and entry.properties["loadout"]:
                    process_component_loadouts(
                        bp,
                        entry,
                        record,
                        parent_loadout=item_port.setdefault("loadout", {}),
                    )
            except Exception as e:
                bp.log(
                    f"processing component SEntityComponentDefaultLoadoutParams",
                    exc_info=e,
                )
    except Exception as e:
        bp.log(
            f"processing component SEntityComponentDefaultLoadoutParams: {component}",
            exc_info=e,
        )
        return False

    return True


@datacore_type_processor("SItemPortContainerComponentParams")
def process_item_port_component_params(
        bp: "Blueprint", component, record: "Record", *args, **kwargs
) -> bool:
    helpers = {}
    for port in component.properties["Ports"]:
        try:
            helper = (
                port.properties["AttachmentImplementation"]
                .properties["Helper"]
                .properties["Helper"]
            )
        except KeyError:
            continue
        offset = helper.properties["Offset"]
        helpers[port.properties["Name"].lower()] = {
            "pos": Vector3D(**offset.properties["Position"].properties),
            "rotation": Quaternion(w=1, **offset.properties["Rotation"].properties),
            "name": helper.properties["Name"].lower(),
        }
        bp.bone_names.add(helper.properties["Name"].lower())
    if helpers:
        geom_path = bp.geometry_for_record(record, base=True)
        parent_geom, _ = bp.get_or_create_geom(geom_path)
        if parent_geom is None:
            if "dockingtube" not in record.name.lower():
                # dockingtube entityclassdefinition records dont have geometry, just ignore them here
                bp.log(
                    f"Could not determine parent geometry for item port component params of {record.filename}",
                    logging.WARNING,
                )
        else:
            parent_geom["helpers"].update(helpers)
    return True


@datacore_type_processor(
    "ShipAudioComponentParams",
    "AudioPassByComponentParams",
    "EntityPhysicalAudioParams",
)
def process_audio_component(bp: "Blueprint", component, record: "Record", *args, **kwargs) -> bool:
    # TODO: handle this
    _search_record(bp, component)
    return True


def _handle_vehicle_definition(bp, rec, def_p4k_path):
    # TODO: this needs to move to p4k processors and down select `xml` files that are vehicle definitions
    def_p4k_path = norm_path(
        f'{"" if def_p4k_path.startswith("data") else "data/"}{def_p4k_path}'
    ).lower()
    bp.add_file_to_extract(def_p4k_path)
    if ("path", def_p4k_path) in bp._entities_to_process:
        bp._entities_to_process.remove(("path", def_p4k_path))

    vdef_info = bp.sc.p4k.NameToInfoLower[def_p4k_path]
    vdef = dict_from_cryxml_file(bp.sc.p4k.open(vdef_info))

    def _walk_parts(part):
        if isinstance(part.get("Part"), dict):
            yield from _walk_parts(part["Part"])
        elif "Part" in part:
            for p in part["Part"]:
                yield from _walk_parts(p)
        elif "Parts" in part:
            yield from _walk_parts(part["Parts"])
        else:
            yield part
        yield part

    parent_geom = bp.geometry_for_record(rec, base=True)
    parent_geom, _ = bp.get_or_create_geom(parent_geom)
    if parent_geom is None:
        raise ValueError(f'Could not determine geometry for record "{rec}"')
    parts = {}
    parent_parts = {}
    for part in _walk_parts(vdef["Vehicle"]["Parts"]):
        if part.get("@class", "") == "Tread":
            parent_parts[part["@name"].lower()] = {
                "filename": part["Tread"]["@filename"],
                "children": [_["@partName"] for _ in part["Tread"]["Wheels"]["Wheel"]],
            }
            try:
                bp.bone_names.add(part["Tread"]["Sprocket"]["@name"].lower())
            except Exception as e:
                bp.log(
                    f"could not process tread part: {part}",
                    exc_info=e,
                )
                pass
            bp.add_material(part["Tread"].get("@materialName", ""))
        if "SubPart" in part and part.get("@class", "") == "SubPartWheel":
            parts[part["@name"].lower()] = part["SubPart"]["@filename"]

    for parent_part_name, params in parent_parts.items():
        parent_part_geom, _ = bp.get_or_create_geom(params["filename"])
        ip = bp.get_or_create_item_port(parent_part_name, parent=parent_geom["loadout"])
        ip["geometry"].add(parent_part_geom["name"])
        bp.bone_names.add(parent_part_name)
        for child_part_name in params["children"]:
            if child_part_name not in parts:
                bp.log(
                    f"did not find child part {child_part_name} for {parent_part_name} in "
                    f'{parent_geom["name"]}'
                )
                continue
            child_part = parts.pop(child_part_name)
            child_geom, _ = bp.get_or_create_geom(child_part)
            ip = bp.get_or_create_item_port(child_part_name, parent=parent_part_geom["loadout"])
            ip["geometry"].add(child_geom["name"])
            bp.bone_names.add(child_part_name)

    for part, part_file in parts.items():
        geom, _ = bp.get_or_create_geom(part_file)
        ip = bp.get_or_create_item_port(part, parent=parent_geom["loadout"])
        ip["geometry"].add(geom["name"])
        bp.bone_names.add(part)


@datacore_type_processor("VehicleComponentParams")
def process_vehicle_components(
        bp: "Blueprint", component, record: "Record", *args, **kwargs
) -> bool:
    vc = component
    for prop in ["landingSystem"]:
        if vc.properties.get(prop):
            bp.add_record_to_extract(vc.properties[prop])
    for prop in ["physicsGrid"]:
        if prop in vc.properties:
            _search_record(bp, vc.properties[prop])
    if vc.properties.get("vehicleDefinition"):
        _handle_vehicle_definition(bp, record, vc.properties["vehicleDefinition"])
    if vc.properties.get("objectContainers"):
        for oc in vc.properties["objectContainers"]:
            try:
                p4k_info = bp.sc.p4k.NameToInfoLower[
                    f'data/{norm_path(oc.properties["fileName"])}'.lower()
                ]
                attrs = {}
                if "Offset" in oc.properties:
                    offset = oc.properties["Offset"].properties
                    attrs = {
                        "pos": offset["Position"].properties,
                        "rotation": ang3_to_quaternion(offset["Rotation"]),
                    }
                bp.add_container(
                    p4k_info.filename,
                    {
                        "socpak": p4k_info,
                        "bone_name": oc.properties["boneName"],
                        "attrs": attrs,
                    },
                )
                # process_socpak(bp, p4k_info.filename, p4k_info, bone_name=oc.properties['boneName'], attrs=attrs)
            except KeyError:
                bp.log(
                    f'could not find socpak for object container: "{oc.properties["fileName"]}"',
                    logging.ERROR,
                )

    return True


@datacore_type_processor("EntityClassDefinition")
def process_entity_class(bp: "Blueprint", record: "Entity") -> bool:
    # handle priority components first
    sorted_components = sorted(
        record.properties["Components"],
        key=lambda c: COMPONENT_PROCESS_PRIORITY.index(c.type)
        if c.type in COMPONENT_PROCESS_PRIORITY
        else 99,
    )
    for component in sorted_components:
        process_datacore_object(bp, component, record=record)
    return True


@datacore_type_processor("SAnimationControllerParams")
def process_animation_controller_params(
        bp: "Blueprint", component, record: "Record", *args, **kwargs
) -> bool:
    # TODO: to better at handling this (remove dict_search)
    d = bp.sc.datacore.record_to_dict(component)
    p4k_files = set(dict_search(d, RECORD_KEYS_WITH_PATHS, ignore_case=True))
    bp.add_file_to_extract([f"Data/Animations/Mannequin/ADB/{_}" for _ in p4k_files])
    return True


@datacore_type_processor("VehicleLandingGearSystem")
def process_vehicle_landing_gear(bp: "Blueprint", record: "Record", *args, **kwargs) -> bool:
    parent_geom = bp.geometry_for_record(bp.entity, base=True)
    parent_geom, _ = bp.get_or_create_geom(parent_geom)
    for gear in record.properties["gears"]:
        try:
            process_geometry_resource_params(bp, gear.properties["geometry"], record)
        except:
            bp.log(
                    f'could not process gear part: {gear}"',
                    logging.ERROR,
                )
            continue
        geom, _ = bp.get_or_create_geom(gear.properties["geometry"].properties["path"])
        if geom is None:
            continue
        ip = bp.get_or_create_item_port(gear.properties["bone"], parent=parent_geom["loadout"])
        ip["geometry"].add(geom["name"])
        bp.bone_names.add(gear.properties["bone"].lower())
    return True
