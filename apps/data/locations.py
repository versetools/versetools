import json
from typing import Any, Union
from scdatatools.sc.object_container import ObjectContainer, ObjectContainerInstance
from translations import translate
from globals import sc, EMPTY_GUID, UNIVERSE_GUID

def get_location_type(data: dict[str, Any]):
    type_id = data.get("type")
    type_record = sc.datacore.records_by_guid.get(type_id) if type_id and type_id != EMPTY_GUID else None
    type = sc.datacore.record_to_dict(type_record) if type_record else None
    return (type_id, type)

def location_from_SSolarSystem(data: dict[str, Any]):
    if data["__type"] != "SSolarSystem":
        raise ValueError("Expected SSolarSystem, got", data["__type"], data)

    if data["SolarSystemRecord"] == EMPTY_GUID:
        print("warning: SolarSystemRecord is set to empty guid", data)
        return None
    
    solar_system_record = sc.datacore.records_by_guid.get(data["SolarSystemRecord"])
    if not solar_system_record:
        print("warning: no record found for SolarSystemRecord", data)
        return None
    
    solar_system_data = sc.datacore.record_to_dict(solar_system_record)

    (type_id, type) = get_location_type(solar_system_data)

    position = data["galacticPosition"]

    return {
        "guid": solar_system_data["__id"],
        "parentGuid": None,
        "name": translate(solar_system_data["name"]),
        "type": type["name"] if type else "SolarSystem",
        "typeGuid": type_id,
        "transform": {
            "type": "galactic",
            "position": {
                "x": position["x"],
                "y": position["y"],
                "z": position["z"]
            },
            "rotation": None
        },
        "surface": False
    }

def location_from_StarMapObject(object: ObjectContainerInstance, parent: Union[dict[str, Any], None] = None):
    record_id = object.attrs.get("starMapRecord")
    if not record_id:
        return None
    
    record = sc.datacore.records_by_guid.get(record_id)
    if not record:
        return None
    
    data = sc.datacore.record_to_dict(record)
    if data["hideInWorld"]:
        return None

    parent_id = data["parent"] if data["parent"] != EMPTY_GUID else None
    if not parent_id and parent:
        parent_id = parent["guid"]

    (type_id, type) = get_location_type(data)

    return {
        "guid": data["__id"],
        "parentGuid": parent_id,
        "name": translate(data["name"]).strip(),
        "type": type["name"] if type else None,
        "typeGuid": type_id,
        "transform": {
            "type": "solar",
            "position": {
                "x": object.position.x,
                "y": object.position.y,
                "z": object.position.z
            },
            "rotation": {
                "w": object.rotation.w,
                "x": object.rotation.x,
                "y": object.rotation.y,
                "z": object.rotation.z
            }
        },
        "surface": type.get("onParentSurface", False) if type else False
    }


location_by_guid = {}

def add_location(location: dict[str, Any]):
    if not location.get("guid"):
        raise ValueError("Expected location to have a guid", location)

    location_by_guid[location["guid"]] = location

def should_load_location_socpak(object: ObjectContainerInstance):
    lower_name = object.name.lower()
    if not lower_name.startswith("data/objectcontainers/pu/"):
        return False

    return "/system" in lower_name or "/station" in lower_name or "/jumppoint" in lower_name

def get_locations_from_object(object: Union[ObjectContainer, ObjectContainerInstance], parent: Union[dict[str, Any], None] = None):
    for child in object.children.values():
        location = location_from_StarMapObject(child, parent)
        if location:
            add_location(location)

        if len(child.children) > 0:
            get_locations_from_object(child, location if location else parent)

        if should_load_location_socpak(child):
            container = sc.oc_manager.load_socpak(child.name)
            get_locations_from_object(container, location if location else parent)

def scan_universe():
    universe_record = sc.datacore.records_by_guid.get(UNIVERSE_GUID)
    if not universe_record:
        raise ValueError(f"Could not find universe record with guid {UNIVERSE_GUID}")

    universe = sc.datacore.record_to_dict(universe_record)

    solar_systems = universe.get("SolarSystems")
    if not solar_systems:
        raise ValueError('"SolarSystems" not found in universe')

    for solar_system in solar_systems:
        megamap = solar_system.get("SMegaMapSolarSystem")
        if not megamap:
            print("No SMegaMapSolarSystem component found", solar_system)
            continue
        
        record = sc.datacore.records_by_guid.get(megamap["Record"])
        star_map_data = sc.datacore.record_to_dict(record)
        if not star_map_data:
            print("Failed to find record for solar system", solar_system)
            continue

        location = location_from_SSolarSystem(star_map_data)
        if location:
            add_location(location)

        object = sc.oc_manager.load_socpak(megamap["ObjectContainers"][0])

        get_locations_from_object(object, location)

def export_locations():
    if len(location_by_guid) == 0:
        scan_universe()

    print("Found", len(location_by_guid.values()), "locations")

    with open("out/locations_map.json", "w") as file:
        json.dump(location_by_guid, file, indent=2)
