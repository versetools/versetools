from typing import Callable
from globals import sc
from translations import missing_translation
from items.tags import ItemTags
from items.types import ItemTypes
from items.entities import get_entity_component, item_from_entity
from items.components import add_commodity_params_data, add_purchasable_params_data, add_resource_container_data, add_consumable_params_data

def add_component_data(item: dict, entity: dict):
    commodity_params = get_entity_component(entity, "CommodityComponentParams")
    if commodity_params:
        add_commodity_params_data(item, commodity_params)

    purchasable_params = get_entity_component(entity, "SCItemPurchasableParams")
    if purchasable_params:
        add_purchasable_params_data(item, purchasable_params)

    resource_container = get_entity_component(entity, "ResourceContainer")
    if resource_container:
        add_resource_container_data(item, resource_container)

    consumable_params = get_entity_component(entity, "SCItemConsumableParams")
    if consumable_params:
        add_consumable_params_data(item, consumable_params)

def create_item(entity: dict, type: str):
    item = item_from_entity(entity, type)
    if not item:
        return None

    add_component_data(item, entity)

    if missing_translation(item["name"]) and not item["tags"] and not item.get("container") and not item.get("consumable"):
        return None

    return item

def get_items_from(path: str, type: str, additional_tags: list[dict] = [], match_mode = "startswith", filter_func: Callable[[dict], bool] = lambda _: True):
    items = []

    for record in sc.datacore.search_filename(path, True, match_mode):
        entity = sc.datacore.record_to_dict(record)
        if not filter_func(entity):
            continue

        item = create_item(entity, type)
        if not item:
            continue

        if additional_tags:
            item["tags"].extend(additional_tags)

        items.append(item)

    return items

def get_all_items():
    items = []

    items.extend(get_items_from("libs/foundry/records/entities/commodities", ItemTypes.COMMODITY))
    items.extend(get_items_from("libs/foundry/records/entities/decorations", ItemTypes.DECORATION))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/carryables", ItemTypes.CARRYABLE))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/consumables", ItemTypes.CONSUMABLE))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/paints", ItemTypes.COMPONENT, additional_tags=[ItemTags.PAINT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/computers", ItemTypes.COMPONENT, additional_tags=[ItemTags.COMPUTER_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/cooler", ItemTypes.COMPONENT, additional_tags=[ItemTags.COOLER_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/gravitygenerator", ItemTypes.COMPONENT, additional_tags=[ItemTags.GRAVITY_GENERATOR_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/jumpdrive", ItemTypes.COMPONENT, additional_tags=[ItemTags.JUMP_DRIVE_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/lifesupport", ItemTypes.COMPONENT, additional_tags=[ItemTags.LIFE_SUPPORT_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/missle_racks", ItemTypes.COMPONENT, additional_tags=[ItemTags.MISSILE_RACK_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/powerplant", ItemTypes.COMPONENT, additional_tags=[ItemTags.POWER_PLANT_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/quantumdrive", ItemTypes.COMPONENT, additional_tags=[ItemTags.QUANTUM_DRIVE_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/radar", ItemTypes.COMPONENT, additional_tags=[ItemTags.RADAR_COMPONENT]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/shieldgenerator", ItemTypes.COMPONENT, additional_tags=[ItemTags.SHIELD_GENERATOR_COMPONENT]))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/utility/mining/miningarm", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.MINING_MODULE]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/utility/mining/miningpods", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.MINING_POD]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/weapons/mining_laser", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.MINING_LASER]))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/utility/refueling/fuelpod", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.FUEL_POD]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/utility/refueling/nozzle", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.FUEL_NOZZLE]))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/utility/salvage/salvagehead", ItemTypes.ATTACHABLE, additional_tags=[ItemTags.SALVAGE_HEAD]))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/weapons/emp", ItemTypes.SHIP_WEAPON, additional_tags=[ItemTags.EMP_DEVICE]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/weapons/missiles", ItemTypes.SHIP_WEAPON, additional_tags=[ItemTags.MISSILE]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/weapons/rocket_pods", ItemTypes.SHIP_WEAPON, additional_tags=[ItemTags.ROCKET_POD]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/ships/weapons/*.xml", ItemTypes.SHIP_WEAPON, match_mode="fnmatch", filter_func=lambda entity: not "Mining_Laser" in entity["__path"]))

    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/device", ItemTypes.CONSUMABLE, additional_tags=[ItemTags.GADGET]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/magazines", ItemTypes.CONSUMABLE, additional_tags=[ItemTags.MAGAZINE]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/mines", ItemTypes.CONSUMABLE, additional_tags=[ItemTags.MINE]))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/fps_weapons", ItemTypes.FPS_WEAPON))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/melee", ItemTypes.MELEE_WEAPON))
    items.extend(get_items_from("libs/foundry/records/entities/scitem/weapons/throwable", ItemTypes.THROWABLE_WEAPON))

    return items
