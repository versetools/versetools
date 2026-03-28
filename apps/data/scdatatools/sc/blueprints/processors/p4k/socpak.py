import logging
import typing

from pyquaternion import Quaternion

from scdatatools.engine.chunkfile import chunks
from scdatatools.engine.model_utils import vector_from_csv, quaternion_from_csv
from scdatatools.sc.blueprints.processors import filetype_processor
from scdatatools.sc.blueprints.processors.lighting import process_light_object
from scdatatools.utils import norm_path

if typing.TYPE_CHECKING:
    from scdatatools.p4k import P4KInfo
    from scdatatools.sc.blueprints import Blueprint


SOC_ENTITY_CLASSES_TO_SKIP = [
    # TODO: all TBDs in here are entityclasses in soc cryxmlbs that havent been researched yet
    "ActionArea",  # TODO: TBD
    # "AreaBox",  # TODO: TBD
    # "AreaShape",  # TODO: TBD
    # "AreaSphere",  # TODO: TBD
    "AudioAreaAmbience",  # TODO: TBD
    "AudioEnvironmentFeedbackPoint",  # TODO: TBD
    "AudioTriggerSpot",  # TODO: TBD
    "CameraSource",  # TODO: TBD
    "ColorGradient",  # TODO: TBD
    "CommentEntity",  # TODO: TBD
    "Door_Ship_Sensor_Proximity_3x3x3",
    "Door_Ship_Sensor_Proximity_2x2x3",
    "Door_Ship_Sensor_Proximity_0_5x1_5x1",
    "EditorCamera",  # TODO: TBD
    # "EnvironmentLight",  # TODO: TBD
    "FogVolume",  # TODO: TBD
    "FlographEntity",  # TODO: TBD
    "GravityArea",  # TODO: TBD
    "GravityBox",  # TODO: TBD
    "GreenZone",  # TODO: TBD
    "Hint",  # TODO: TBD
    "Hazard",  # TODO: TBD
    "Ladder",  # Does not seem to contain any relevant info
    "LandingArea",  # TODO: TBD
    "LedgeObject",  # TODO: TBD
    "LocationManager",  # TODO: TBD
    # "Light",  # TODO: TBD
    # "LightBox",  # TODO: TBD
    # "LightGroup",  # TODO: TBD
    # "LightGroupPoweredItem",  # TODO: TBD
    "MusicArea",  # TODO: TBD
    "NavigationArea",  # TODO: TBD
    "ParticleField",  # TODO: TBD
    "ParticleEffect",  # TODO: TBD
    "PlanetAreaEntity",  # TODO: TBD
    "ProceduralPointOfInterestProxy",  # TODO: TBD
    "Room",  # Audio # TODO: TBD
    "RoomConnector",  # TODO: TBD
    # "RotationSimple",  # Geometry that has rotation animation
    "SafeTeleportPoint",
    "SCShop",
    "SequenceObjectItem",  # TODO: TBD
    "ShadowRegionEntity",  # TODO: TBD
    "SurfaceRaindropsTarget",  # TODO: TBD
    "TagPoint",  # TODO: TBD
    "TransitDestination",  # TODO: TBD
    "TransitGateway",  # TODO: TBD
    # 'TransitManager',  # TODO: TBD
    "TransitNavSpline",  # TODO: TBD
    "VibrationAudioPoint",  # TODO: TBD
    "VehicleAudioPoint",  # TODO: TBD
]


# @filetype_processor('soc')   # socs are always immediately processed by the socpak generator
def process_soc(bp: "Blueprint", soc, bone_name, geom_attrs):
    """
    Process a `soc`
    """
    from scdatatools.sc.blueprints.generators.object_containers import (
        blueprint_from_socpak,
    )

    bpsoc, created = bp.get_or_create_soc(norm_path(soc.soc_info.filename).lower())
    if not created:
        return  # already been loaded

    for ico_id, ico in soc.included_objects.items():
        try:
            bp.add_file_to_extract(ico.filenames)
            materials = ico.materials
            for obj in ico.objects:
                if isinstance(obj, chunks.IncludedObjectType1):
                    geom, _ = bp.get_or_create_geom(obj.filename)
                    geom.add_instance(
                        "",
                        pos=obj.pos,
                        rotation=obj.rotation,
                        scale=obj.scale,
                        materials=materials,
                        attrs=geom_attrs,
                        soc=bpsoc,
                    )
        except Exception as e:
            bp.log(
                f"Error processing chunk {ico_id} in soc {soc.soc_info.filename}",
                exc_info=e,
            )
    for cxml_id, cxml in soc.cryxml_chunks.items():
        d = cxml.dict()
        # Root can be Entities or SCOC_Entities
        entities = d.get("Entities", d.get("SCOC_Entities", {})).get("Entity")
        if isinstance(entities, dict):
            entities = [entities]  # only one entity in this cryxmlb
        for entity in entities:
            try:
                geom = None
                if entity.get("@EntityClass") in SOC_ENTITY_CLASSES_TO_SKIP:
                    continue  # TODO: handle these, see SOC_ENTITY_CLASSES_TO_SKIP
                elif "EntityGeometryResource" in entity.get("PropertiesDataCore", {}):
                    geom, _ = bp.get_or_create_geom(
                        entity["PropertiesDataCore"]["EntityGeometryResource"]["Geometry"][
                            "Geometry"
                        ]["Geometry"]["@path"]
                    )
                elif entity.get("@EntityClass") == "TransitManager":
                    gateway_index = int(
                        entity["SCTransitManager"]["CarriageSpawnLocations"]["SpawnLocation"][
                            "@gatewayIndex"
                        ]
                    )
                    gateway = entity["SCTransitManager"]["TransitDestinations"]["Destination"][
                        gateway_index
                    ]
                    blueprint_from_socpak(
                        bp.sc,
                        socpak=entity["PropertiesDataCore"]["SCTransitManager"]["carriageInterior"][
                            "@path"
                        ],
                        container_name=entity["@Name"],
                        bp=bp,
                        attrs={
                            "pos": (
                                vector_from_csv(entity["@Pos"])
                                + vector_from_csv(gateway["Gateway"]["@gatewayPos"])
                            ),
                            "rotation": (
                                quaternion_from_csv(entity.get("@Rotate", "1,0,0,0"))
                                * quaternion_from_csv(gateway["Gateway"]["@gatewayQuat"])
                            ),
                        },
                    )
                    continue
                elif "Light" in entity.get("@EntityClass"):
                    process_light_object(bp, bpsoc, entity, bone_name)
                    continue
                elif ecguid := entity.get("@EntityClassGUID"):
                    base_geom_path = bp.geometry_for_record(
                        bp.sc.datacore.records_by_guid.get(ecguid), base=True
                    )
                    geom, _ = bp.get_or_create_geom(base_geom_path)
                if geom is not None:
                    w, x, y, z = (float(_) for _ in entity.get("@Rotate", "1,0,0,0").split(","))
                    if "@Layer" in entity:
                        geom_attrs["layer"] = entity["@Layer"]
                    geom.add_instance(
                        name=entity["@Name"],
                        pos=vector_from_csv(entity.get("@Pos", "0,0,0")),
                        rotation=Quaternion(x=x, y=y, z=z, w=w),
                        scale=vector_from_csv(entity.get("@Scale", "1,1,1")),
                        materials=[entity.get("@Material", "")],
                        attrs=geom_attrs,
                        soc=bpsoc,
                    )
                else:
                    bp.log(
                        f"DEBUG: non-skipped soc EntityClass doesnt have geometry: "
                        f'{entity.get("@EntityClass")}',
                        logging.DEBUG,
                    )
            except Exception as e:
                bp.log(
                    f'Failed to parse soc CryXmlB entity "{entity["@Name"]}"',
                    exc_info=e,
                )


@filetype_processor("socpak")
def process_socpak(
    bp: "Blueprint",
    path: str,
    p4k_info: "P4KInfo",
    bone_name="",
    attrs=None,
    *args,
    **kwargs,
) -> bool:
    """
    Extracts the images used in a GFX object and adds them to the blueprint. The layer order will be maintained
    and represented in the Blueprint's `asset_info` for the given path
    """
    # try:
    #     blueprint_from_socpak(sc=bp.sc, socpak=p4k_info, bp=bp, bone_name=bone_name, attrs=attrs, *args, **kwargs)
    # except Exception as e:
    #     bp.log(f'failed to process object container "{p4k_info.filename}"', exc_info=e)

    bp.add_container(path, {"socpak": p4k_info, "bone_name": bone_name, "attrs": attrs})

    return True
