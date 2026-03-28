import logging
import typing

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from scdatatools.sc.blueprints import Blueprint

SKIPPED_LIGHT_TYPES = [
    "ChipSet_LightControl",  # seems to be the control panels for lights (400i), add empty?
    "EnvironmentLight",  # this could just be faked GI, we dont _need_ this outside of
    # engine so can maybe just leave it skipped
]


def process_light_object(bp: "Blueprint", soc, entity: dict, bone_name=""):
    eclass = entity["@EntityClass"]
    attrs = {
        "layer": entity.get("@Layer"),
    }
    if bone_name:
        attrs["bone_name"] = bone_name
    if eclass == "Light":
        light_group = soc["lights"].setdefault(bone_name, {})
        lc = entity["PropertiesDataCore"]["EntityComponentLight"]
        bp.add_file_to_extract(lc["projectorParams"].get("@texture", ""))
        lc["GeomLinks"] = entity.get("GeomLinks", {})
        light_group[entity["@Name"]] = {
            "@Pos": entity.get("@Pos", "0,0,0"),
            "@Rotate": entity.get("@Rotate", "1,0,0,0"),
            "EntityComponentLight": lc,
            "attrs": attrs,
        }
    elif eclass == "LightGroup":
        light_group = soc["lights"].setdefault(entity["@Name"], {})
        lights = (
            entity.get("EntityComponentLightGroup", {}).get("BakedInLights", {}).get("Light", [])
        )
        if isinstance(lights, dict):
            lights = [lights]
        for i, light in enumerate(lights):
            bp.add_file_to_extract(
                light["EntityComponentLight"]["projectorParams"].get("@texture", "")
            )
            light.update(
                {
                    "@Pos": entity.get("@Pos", "0,0,0"),
                    "@Rotate": entity.get("@Rotate", "1,0,0,0"),
                    "attrs": attrs,
                }
            )
            light_group[light.get("@Name", f'{entity["@Name"]}-{i:03}')] = light
    elif eclass == "LightGroupPoweredItem":
        pass  # TODO: TBD
    elif eclass == "LightBox":
        pass  # TODO: TBD
    elif eclass in SKIPPED_LIGHT_TYPES:
        pass
        # TODO: missing ['EntityComponentLight']['@lightType'] - what should the light type be?
        # light_group = self.current_container['lights'].setdefault(entity['@Name'], {})
        # light_group[entity['@Name']] = {
        #     '@Pos': entity.get('@Pos', "0,0,0"),
        #     '@Rotate': entity.get('@Rotate', "1,0,0,0"),
        #     'EntityComponentLight': entity['PropertiesDataCore']['EntityComponentEnvironmentLight'],
        #     'GeomLinks': entity.get('GeomLinks', {}),
        #     'attrs': {
        #         'bone_name': bone_name,
        #         'layer': entity.get('@Layer'),
        #     }
        # }
    else:
        logger.warning(f"Unhandled light type {eclass}")
