from pathlib import Path
from translations import translate

def get_entity_component(entity_class: dict, component_name: str):
    components = entity_class.get("Components", [])
    for component in components:
        if component.get(component_name):
            return component[component_name]

    return None

def get_entity_item_translation_ref(prefixes: list[str], entity_class: dict):
    file_name = Path(entity_class["__path"]).stem.lower()

    translation_key, name = "", ""

    for prefix in prefixes:
        translation_key = "@" + prefix + file_name
        name = translate(translation_key)
        
        if name != translation_key:
            break

    return {
        "translationKey": translation_key,
        "value": name
    }

def get_entity_translation_refs(entity_class: dict):
    return {
        "name": get_entity_item_translation_ref(["item_name", "item_name_"], entity_class),
        "description": get_entity_item_translation_ref(["item_desc", "item_desc_"], entity_class)
    }

def add_static_entity_data(item: dict, entity_class: dict):
    static_data = entity_class["StaticEntityClassData"]
    display_params = static_data[0].get("EntityUIDisplayParams") if static_data else None
    if display_params:
        item["displayImage"] = display_params["displayIcon"] if display_params["displayIcon"] else display_params["displayImage"]

def item_from_entity(entity_class: dict, type: str):
    if entity_class.get("__type") != "EntityClassDefinition":
        return None
    
    if "/dev/" in entity_class["__path"] or "/test/" in entity_class["__path"]:
        return None

    file_name = Path(entity_class["__path"]).stem.lower()
    if file_name.endswith("_template") or "_test" in file_name:
        return None

    entity_translations = get_entity_translation_refs(entity_class)

    item = {
        "guid": entity_class["__id"],
        "type": type,
        "name": entity_translations["name"],
        "description": entity_translations["description"],
        "invisible": entity_class["Invisible"],
        "tags": []
    }

    add_static_entity_data(item, entity_class)

    return item