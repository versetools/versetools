import json
from pathlib import Path
from globals import sc, EMPTY_GUID
from translations import translate

def get_entity_class_item_name(entity_class: dict):
    PREFIXES = ["item_name", "item_name_"]

    file_name = Path(entity_class["__path"]).stem

    translation_key, name = "", ""

    for prefix in PREFIXES:
        translation_key = "@" + prefix + file_name
        name = translate(translation_key)
        
        if name != translation_key:
            break
    
    return (translation_key, name)

def get_blueprints_from_pool(blueprint_pool: dict):
    blueprints = []

    for blueprint_reward in blueprint_pool.get("blueprintRewards", []):
        blueprint_reward = blueprint_reward.get("BlueprintReward")
        if not blueprint_reward:
            continue

        blueprint_id = blueprint_reward.get("blueprintRecord")
        blueprint = sc.datacore.records_by_guid.get(blueprint_id) if blueprint_id != EMPTY_GUID else None
        blueprint = sc.datacore.record_to_dict(blueprint) if blueprint else None
        if not blueprint:
            continue

        blueprint = blueprint["blueprint"]

        process_specific_data = blueprint.get("processSpecificData")
        if not process_specific_data:
            continue

        entity_class_id = process_specific_data.get("entityClass")
        entity_class = sc.datacore.records_by_guid.get(entity_class_id) if entity_class_id != EMPTY_GUID else None
        entity_class = sc.datacore.record_to_dict(entity_class) if entity_class else None
        if not entity_class:
            continue

        (name_translation_key, name) = get_entity_class_item_name(entity_class)

        blueprints.append({
            "guid": blueprint_id,
            "entityClassGuid": entity_class_id,
            "nameTranslationKey": name_translation_key,
            "name": name,
            "tiers": len(blueprint.get("tiers", []))
        })
    
    return blueprints

def get_mission_type(type_id: str):
    type = sc.datacore.records_by_guid.get(type_id) if type_id != EMPTY_GUID else None
    type = sc.datacore.record_to_dict(type) if type else None

    data = {}

    data["guid"] = type_id

    name_translation_key = type.get("LocalisedTypeName") if type else None
    if name_translation_key:
        data["translationKey"] = name_translation_key
        data["name"] = translate(name_translation_key)

    return data

def get_contract_params(contract_params: dict, mission_id_for_logging: str):
    params = {}

    type_override_id = contract_params.get("missionTypeOverride")
    if type_override_id and type_override_id != EMPTY_GUID:
        params["type"] = get_mission_type(type_override_id)

    for param in contract_params.get("boolParamOverrides", []):
        param = param["ContractBoolParam"]
        param_type = param["param"]

        if param_type == "Illegal":
            params["illegal"] = param["value"]

    for param in contract_params.get("stringParamOverrides", []):
        param = param["ContractStringParam"]
        param_type = param["param"]

        if param_type == "Title":
            translation_key = param["value"]
            params["titleTranslationKey"] = translation_key
            params["title"] = translate(translation_key)
        elif param_type == "Description":
            translation_key = param["value"]
            params["descriptionTranslationKey"] = translation_key
            params["description"] = translate(translation_key)
        elif param_type == "Contractor":
            translation_key = param["value"]
            params["contractorTranslationKey"] = translation_key
            params["contractor"] = translate(translation_key)

    for property in contract_params.get("propertyOverrides", []):
        property = property["MissionProperty"]
        
        if property["extendedTextToken"] == "Contractor":
            match_conditions = property.get("matchConditions")
            if not match_conditions:
                print("Warning: Contractor property has no match conditions", mission_id_for_logging, match_conditions)
                continue

            if len(match_conditions) != 1:
                print("Warning: Contractor property doesn't have exactly one match condition", mission_id_for_logging, match_conditions)
                continue

            condition = next(iter(match_conditions[0].values()))
            if not condition:
                continue

            organisations = condition.get("organizations")
            if not organisations:
                print("Warning: Contractor condition has no organisations", mission_id_for_logging, organisations)
                continue

            if len(organisations) > 1:
                print("Warning: Contractor condition has more than one organisation", mission_id_for_logging, organisations)
                continue

            contractor_id = next(iter(organisations[0].values()))
            params["contractor_id"] = contractor_id

    return params

def get_mission_rewards(contract_results: dict):
    rewards = {}

    for result_entry in contract_results.get("contractResults", []):
        result = next(iter(result_entry.values()), None)
        if not result:
            continue
        
        result_type = result.get("__polymorphicType", None)
        if result_type == "BlueprintRewards":
            blueprint_pool_id = result.get("blueprintPool")
            blueprint_pool = sc.datacore.records_by_guid.get(blueprint_pool_id) if blueprint_pool_id != EMPTY_GUID else None
            blueprint_pool = sc.datacore.record_to_dict(blueprint_pool) if blueprint_pool else None
            if not blueprint_pool:
                continue

            chance = result.get("chance", 1)
            rewards["blueprintChance"] = chance
            rewards["blueprints"] = get_blueprints_from_pool(blueprint_pool)
    
    return rewards

def mission_from_contract(contract: dict, base_status: str, base_params: dict, generator_id: str):
    mission = {
        "guid": contract["id"],
        "generatorGuid": generator_id,
        "type": contract.get("__polymorphicType", "Contract"),
        "status": base_status,
        "title": None,
        "description": None,
        "contractor": None,
    }

    template_id = contract.get("template")
    template = None
    if template_id:
        template_record = sc.datacore.records_by_guid.get(template_id) if template_id != EMPTY_GUID else None
        template = sc.datacore.record_to_dict(template_record) if template_record else None
    
    mission["templateGuid"] = template_id if template else None

    if base_status == "active":
        if contract.get("notForRelease"):
            mission["status"] = "unreleased"
        elif contract.get("workInProgress"):
            mission["status"] = "workInProgress"

    params = base_params.copy()
    param_overrides = contract.get("paramOverrides")
    if param_overrides:
        override_params = get_contract_params(param_overrides, mission_id_for_logging="generator:{generator_id}:mission:{mission_id}".format(generator_id=generator_id, mission_id=contract["id"]))
        params.update(override_params)
    
    mission.update(params)

    contractor = None
    if "contractor_id" in mission:
        contractor = sc.datacore.records_by_guid.get(mission["contractor_id"]) if mission["contractor_id"] != EMPTY_GUID else None
        contractor = sc.datacore.record_to_dict(contractor) if contractor else None

    if contractor:
        if not mission["contractor"]:
            mission["contractor"] = translate()

    results = contract.get("contractResults")
    if results:
        mission["buyInCost"] = results.get("contractBuyInAmount", 0)
        mission["estimatedTimeToComplete"] = results.get("timeToComplete", -1)
        mission["rewards"] = get_mission_rewards(results)    

    return mission

def export_missions():
    contract_generators = sc.datacore.search_filename("libs/foundry/records/contracts/contractgenerator", True, "startswith")

    missions = []

    for contract_generator in contract_generators:
        contract_generator = sc.datacore.record_to_dict(contract_generator)

        generator_id = contract_generator["__id"]
        generator_handlers: list[dict[str, dict]] = contract_generator.get("generators", [])

        for generator_handler in generator_handlers:
            generator_handler = next(iter(generator_handler.values()), None)
            if not generator_handler:
                continue

            contract_params = generator_handler.get("contractParams")
            base_params = get_contract_params(contract_params, mission_id_for_logging="generator:{generator_id}".format(generator_id=generator_id)) if contract_params else {}

            base_status = "active"
            if generator_handler.get("notForRelease"):
                base_status = "unreleased"
            elif generator_handler.get("workInProgress"):
                base_status = "workInProgress"

            contracts: list[dict] = generator_handler.get("contracts", [])
            intro_contracts: list[dict] = generator_handler.get("introContracts", [])
            contracts.extend(intro_contracts)

            for contract in contracts:
                contract = next(iter(contract.values()), None)
                if not contract:
                    continue

                mission = mission_from_contract(contract, base_status=base_status, base_params=base_params, generator_id=generator_id)
                missions.append(mission)

                # print(len(missions), mission["guid"], mission["title"])
                
                # sub_contracts = contract.get("subContracts", [])
                # for sub_contract_entry in sub_contracts:
                #     sub_contract = sub_contract_entry["SubContract"]
                #     if not sub_contract:
                #         continue

                #     sub_missions = missions_from_contract(sub_contract)
                #     missions.extend(sub_missions)

    
    print("Found", len(missions), "missions")

    with open("out/missions.json", "w") as file:
        json.dump(missions, file, indent=2)

if __name__ == "__main__":
    export_missions()