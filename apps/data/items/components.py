from globals import record_data_by_guid
from translations import missing_translation, translation_ref
from items.tags import ItemTags, ref_item_tag, item_tag

def get_volume_as_scu(volume: dict):
    if "standardCargoUnits" in volume:
        return volume["standardCargoUnits"]
    elif "centiSCU" in volume:
        return volume["centiSCU"] / 100
    elif "microSCU" in volume:
        return volume["microSCU"] / 1000
    else:
        print("Warning: unknown volume", volume)

    return 0

def add_commodity_params_data(item: dict, commodity_params: dict):
    if missing_translation(item["name"]):
        item["name"] = translation_ref(commodity_params["name"])

    if missing_translation(item["description"]):
        item["description"] = translation_ref(commodity_params["description"])

    if commodity_params["IsUnrefinedElement"]:
        item["tags"].append(ItemTags.RAW)

    if commodity_params["boxable"]:
        item["tags"].append(ItemTags.BOXABLE)

    commodity_type = record_data_by_guid(commodity_params["type"])
    if commodity_type:
        tag = ref_item_tag(commodity_type, name_key=commodity_type["name"], description_key=commodity_type["description"])
        item["tags"].append(tag)

    commodity_sub_type = record_data_by_guid(commodity_params["subtype"])
    if commodity_sub_type:
        tag = ref_item_tag(commodity_sub_type, name_key=commodity_sub_type["name"], description_key=commodity_sub_type["description"])
        item["tags"].append(tag)

def add_purchasable_params_data(item: dict, purchasable_params: dict):
    name_tag = item_tag(type="PurchasableName", name_key=purchasable_params["displayName"])
    item["tags"].append(name_tag)

    if missing_translation(item["name"]):
        item["name"] = name_tag["name"]

    item["tags"].append(item_tag(type="PurchasableType", name_key=purchasable_params["displayType"]))

    if purchasable_params["allowQuickBuy"]:
        item["tags"].append(ItemTags.QUICK_BUYABLE)

    if purchasable_params["displayThumbnail"]:
        item["invIcon"] = purchasable_params["displayThumbnail"]

def add_resource_container_data(item: dict, resource_params: dict):
    if resource_params["generateRandomQuality"]:
        item["tags"].append(ItemTags.RANDOM_RESOURCE_QUALITY)

    container = {
        "capacity": get_volume_as_scu(resource_params["capacity"])
    }

    default_composition = resource_params.get("defaultComposition", [])
    if default_composition:
        composition = []

        for composition_entry in default_composition:
            composition_entry = next(iter(composition_entry.values()), None)
            if not composition_entry:
                continue

            resource_id = composition_entry.get("entry")
            if not resource_id:
                continue

            resource = record_data_by_guid(resource_id)
            if not resource:
                continue

            composition.append({
                "guid": resource["__id"],
                "type": resource["__type"],
                "name": translation_ref(resource["displayName"]),
                "description": translation_ref(resource["description"]),
                "weight": composition_entry["weight"]
            })

        if len(composition) > 0:
            main_resource = composition[0]

            if missing_translation(item["name"]):
                item["name"] = main_resource["name"]

            if missing_translation(item["description"]):
                item["description"] = main_resource["description"]

        container["composition"] = composition

    item["container"] = container

def add_consumable_params_data(item: dict, consumable_params: dict):
    if consumable_params["canBeReclosed"]:
        item["tags"].append(ItemTags.CONSUMABLE_REUSABLE)
    
    consumable = {
        "volume": get_volume_as_scu(consumable_params["consumableVolume"])
    }

    default_contents = consumable_params.get("defaultContents", [])
    if default_contents:
        contents = []
        for content_entry in default_contents:
            content_entry = content_entry.get("ConsumableContent")
            if not content_entry:
                continue

            type = record_data_by_guid(content_entry["consumableSubtype"])
            if not type:
                continue

            ratio = content_entry["ratio"]

            name = translation_ref(type["consumableName"])
            if missing_translation(name) and ratio == 1 and not missing_translation(item["name"]):
                name = item["name"]

            contents.append({
                "guid": type["__id"],
                "type": type["__type"],
                "name": name,
                "ratio": ratio
            })
        
        if len(contents) > 0:
            main_content = contents[0]

            if missing_translation(item["name"]):
                item["name"] = main_content["name"]

        consumable["contents"] = contents
    
    item["consumable"] = consumable