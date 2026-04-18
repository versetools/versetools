
from typing import Union
from translations import translation_ref

def item_tag(
    type: str,
    guid: Union[str, None] = None,
    name_key: Union[str, None] = None,
    name_override: Union[str, None] = None,
    description_key: Union[str, None] = None,
    description_override: Union[str, None] = None
):
    tag = {}
    if guid:
        tag["guid"] = guid

    tag.update({
        "type": type,
        "name": translation_ref(
            name_key if name_key else "#!MISSING",
            override_value=name_override
        ),
        "description": translation_ref(
            description_key if description_key else "#!MISSING",
            override_value=description_override
        ) if description_key or description_override else None
    })

    return tag

def ref_item_tag(data: dict, name_key: Union[str, None] = None, description_key: Union[str, None] = None):
    return item_tag(guid=data["__id"], type=data["__type"], name_key=name_key, description_key=description_key)

class ItemTags:
    RAW = item_tag(type="Raw", name_key="@vt_item_tag_raw", name_override="Raw")
    BOXABLE = item_tag(type="Boxable", name_key="@vt_item_tag_boxable", name_override="Boxable")
    QUICK_BUYABLE = item_tag(type="QuickBuy", name_key="@vt_item_tag_quick_buyable", name_override="Quick Buyable")
    RANDOM_RESOURCE_QUALITY = item_tag(type="RandomResourceQuality", name_key="@vt_item_tag_random_resource_quality", name_override="Random Resource Quality")
    CONSUMABLE_REUSABLE = item_tag(type="Reusable", name_key="@vt_item_tag_consumable_reusable", name_override="Reusable")

    # Handheld weapons
    MINE = item_tag(type="Mine", name_key="@vt_item_tag_mine", name_override="Mine")
    GADGET = item_tag(type="Gadget", name_key="@vt_item_tag_gadget", name_override="Gadget")
    MAGAZINE = item_tag(type="Magazine", name_key="@vt_item_tag_magazine", name_override="Magazine")

    # Mining
    MINING_MODULE = item_tag(type="MiningModule", name_key="@vt_item_tag_mining_module", name_override="Mining Module")
    MINING_POD = item_tag(type="MiningPod", name_key="@vt_item_tag_mining_pod", name_override="Mining Pod")
    MINING_LASER = item_tag(type="MiningLaser", name_key="@vt_item_tag_mining_laser", name_override="Mining Laser")

    # Refueling
    FUEL_POD = item_tag(type="FuelPod", name_key="@vt_item_tag_fuel_pod", name_override="Fuel Pod")
    FUEL_NOZZLE = item_tag(type="FuelNozzle", name_key="@vt_item_tag_fuel_nozzle", name_override="Fuel Nozzle")

    # Salvage
    SALVAGE_HEAD = item_tag(type="SalvageHead", name_key="@vt_item_tag_salvage_head", name_override="Salvage Head")

    # Ship weapons
    EMP_DEVICE = item_tag(type="EmpDevice", name_key="@vt_item_tag_emp_device", name_override="EMP Device")
    MISSILE = item_tag(type="Missile", name_key="@vt_item_tag_missile", name_override="Missile")
    ROCKET_POD = item_tag(type="RocketPod", name_key="@vt_item_tag_rocket_pod", name_override="Rocket Pod")

    # Components
    PAINT = item_tag(type="Paint", name_key="@vt_item_tag_paint", name_override="Paint")
    COMPUTER_COMPONENT = item_tag(type="ComputerComponent", name_key="@vt_item_tag_computer_component", name_override="Computer")
    COOLER_COMPONENT = item_tag(type="CoolerComponent", name_key="@vt_item_tag_cooler_component", name_override="Cooler")
    GRAVITY_GENERATOR_COMPONENT = item_tag(type="GravityGeneratorComponent", name_key="@vt_item_tag_gravity_generator_component", name_override="Gravity Generator")
    JUMP_DRIVE_COMPONENT = item_tag(type="JumpDriveComponent", name_key="@vt_item_tag_jump_drive_component", name_override="Jump Drive")
    LIFE_SUPPORT_COMPONENT = item_tag(type="LifeSupportComponent", name_key="@vt_item_tag_life_support_component", name_override="Life Support")
    MISSILE_RACK_COMPONENT = item_tag(type="MissileRackComponent", name_key="@vt_item_tag_missile_rack_component", name_override="Missile Rack")
    POWER_PLANT_COMPONENT = item_tag(type="PowerPlantComponent", name_key="@vt_item_tag_power_plant_component", name_override="Power Plant")
    QUANTUM_DRIVE_COMPONENT = item_tag(type="QuantumDriveComponent", name_key="@vt_item_tag_quantum_drive_component", name_override="Quantum Drive")
    RADAR_COMPONENT = item_tag(type="RadarComponent", name_key="@vt_item_tag_radar_component", name_override="Radar")
    SHIELD_GENERATOR_COMPONENT = item_tag(type="ShieldGeneratorComponent", name_key="@vt_item_tag_shield_generator_component", name_override="Shield Generator")
