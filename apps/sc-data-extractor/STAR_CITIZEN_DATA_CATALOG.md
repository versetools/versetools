# Star Citizen client data catalog

This document maps useful database data in the Star Citizen client `Data.p4k` and DataCore. It is intended as an implementation guide for future extractors and ingesters, not as a stable game-data specification.

## Inspected build

The paths, record counts, and fields below were verified with the Starbreaker crates against:

| Property         | Value                    |
| ---------------- | ------------------------ |
| Branch           | `sc-alpha-4.10.0-hotfix` |
| Build date       | 2026-09-03               |
| P4 changelist    | `12572603`               |
| Client version   | `1.0.191.55227`          |
| DataCore         | `Data/Game2.dcb`         |
| P4K entries      | 1,365,842                |
| DataCore records | 116,921                  |

Record names, paths, structures, and feature readiness change between builds. Persist the build ID/changelist with every import and treat the fields in this document as versioned input.

## Source hierarchy

Use these sources together. None is a complete database by itself.

1. **DataCore (`Data/Game*.dcb`)** is the primary source for definitions and relationships: entities, item components, vehicles, resources, crafting, missions, reputation, law, starmap metadata, and global tuning.
2. **Object containers (`Data/ObjectContainers/**/\*.socpak`)\*\* provide placed instances, transforms, physical shops, transit objects, and the hierarchy needed to put DataCore starmap records in the world.
3. **P4K JSON/XML/CryXmlB** provides data not represented cleanly in DataCore, especially shop inventory defaults, vehicle physics definitions, and loadouts.
4. **Localization (`Data/Localization/<language>/global.ini`)** resolves all user-facing `@keys`.
5. **Build metadata (`build_manifest.id`)** identifies the source version.

### DataCore export shape

Starbreaker's JSON exporter emits top-level records as:

```json
{
	"_RecordId_": "record-guid",
	"_RecordName_": "StructType.RecordName",
	"_RecordTag_": "domain-tag",
	"_RecordValue_": {
		"_Type_": "StructType"
	}
}
```

Important conventions:

- `_RecordId_` is the durable primary key. Keep `_RecordName_`, source path, and `_RecordTag_` as alternate identifiers and provenance.
- `_Type_` is a polymorphic discriminator. Always dispatch components, costs, rewards, and mission structures by `_Type_`; array position is not stable.
- A DataCore reference may contain `_RecordId_`, `_RecordName_`, and `_RecordPath_`. Entity/file references exported by the current addon may instead be `{ "guid", "path" }`. Normalize both forms to one reference type.
- Empty GUID `00000000-0000-0000-0000-000000000000` means no reference.
- Preserve unknown fields or the full source JSON. DataCore schemas gain and remove component variants frequently.
- A single source file can contain a parent record and many embedded records. Do not use source path as a unique record key.

### Starbreaker inspection pattern

Discover all top-level `Game*.dcb` files and prefer the highest numeric version. Do not hard-code `Game2.dcb`.

```rust
use starbreaker_datacore::{database::Database, export};

let p4k = starbreaker_p4k::open_p4k()?;
let entry = p4k
  .entries()
  .iter()
  .filter(|entry| {
    let path = entry.name.replace('/', "\\").to_ascii_lowercase();
    path.starts_with("data\\game") && path.ends_with(".dcb")
  })
  .max_by_key(|entry| datacore_version(&entry.name))
  .expect("DataCore not found");

let bytes = p4k.read(entry)?;
let db = Database::from_bytes(&bytes)?;

for record in db.records() {
  let record_type = db.struct_name(record.struct_id());
  let source_path = db.resolve_string(record.file_name_offset);
  let json = export::to_json(&db, record)?;
  // Route by record_type and retain source_path as provenance.
}
```

Index records by GUID, DataCore source path, `_RecordName_`, and record type before domain extraction. Most useful datasets require multiple GUID joins.

## Core entities: items, components, and vehicles

### Entity records

The common base is `EntityClassDefinition` (29,184 records) under `libs/foundry/records/entities/**`.

Useful path families include:

| Family                                      | DataCore path prefix                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| Ships                                       | `libs/foundry/records/entities/spaceships/`                 |
| Commodities                                 | `libs/foundry/records/entities/commodities/`                |
| Decorations                                 | `libs/foundry/records/entities/decorations/`                |
| Carryables                                  | `libs/foundry/records/entities/scitem/carryables/`          |
| Consumables                                 | `libs/foundry/records/entities/scitem/consumables/`         |
| Ship components                             | `libs/foundry/records/entities/scitem/ships/`               |
| FPS weapons                                 | `libs/foundry/records/entities/scitem/weapons/fps_weapons/` |
| Magazines, mines, melee, throwable, gadgets | sibling directories under `entities/scitem/weapons/`        |
| Armor and clothing                          | `libs/foundry/records/entities/scitem/characters/`          |

Do not classify solely by directory. Use the entity's `Components[*]._Type_`, `tags`, and attachment definition. Paths contain legacy spellings and occasional misplaced records.

### Common item fields

Extract these from each `EntityClassDefinition`:

| Field                                                                      | Use                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------- |
| `_RecordId_`, `_RecordName_`, source path, `tags`                          | Identity, aliases, classification, provenance      |
| `Invisible`, `Category`, `Icon`                                            | Visibility and broad UI category                   |
| `StaticEntityClassData[*].displayName`, `displayDescription`               | Preferred localized labels when present            |
| `StaticEntityClassData[*].displayIcon`, `displayImage`, `displayThumbnail` | UI media paths                                     |
| `AttachDef.Type`, `SubType`, `Size`, `Grade`                               | Item/component type, subtype, size, and grade      |
| `AttachDef.Manufacturer`                                                   | Manufacturer reference                             |
| `AttachDef.Localization.Name`, `ShortName`, `Description`                  | Item localization keys                             |
| `AttachDef.inventoryOccupancyVolume.microSCU`                              | Inventory volume                                   |
| `AttachDef.inventoryOccupancyDimensions`, bounds, fixed-grid dimensions    | Physical inventory footprint                       |
| `PhysType.Mass`                                                            | Item mass                                          |
| `Health`, `DamageCap`, `DamageResistances`                                 | Durability and damage behavior                     |
| `Geometry.*.Wear`, `loadout.WearRange`, `loadout.DirtRange`                | Wear/dirt defaults                                 |
| `Ports`, `InternalHardpointLinks`, `loadout.entries`                       | Compatibility, hardpoints, and default attachments |
| `resourceNetworkPowerPools`, `InternalResourceLinks`                       | Resource network membership                        |
| `temperature.itemResourceParams`                                           | Operating/overheat/cooling limits                  |
| `temperature.signatureParams`                                              | Thermal-to-IR behavior                             |
| state `signatureParams.EMSignature` / `IRSignature`                        | Nominal emissions and decay                        |
| `misfireLevels`, `misfires`, state modifiers                               | Degradation and failure behavior                   |

Build a component index by discriminator before extraction:

```rust
fn components_by_type(record: &serde_json::Value) -> std::collections::HashMap<&str, Vec<&serde_json::Value>> {
  let mut result = std::collections::HashMap::new();
  let components = record["_RecordValue_"]["Components"]
    .as_array()
    .into_iter()
    .flatten();

  for component in components {
    if let Some(component_type) = component["_Type_"].as_str() {
      result.entry(component_type).or_insert_with(Vec::new).push(component);
    }
  }
  result
}
```

### Components and modules

The component hierarchy under `entities/scitem/ships/` includes power plants, coolers, quantum drives, jump drives, shields, radars, computers/blades, life support, gravity generators, missile racks, weapons, mining, salvage, refueling, paints, cargo grids, seats, and utility attachments.

In addition to the common item fields, useful specialized data includes:

- **Quantum/jump drives:** `driveSpeed`, `engageSpeed`, `cooldownTime`, `jumpRange`, `quantumFuelRequirement`, spline-jump values, and references to `JumpDriveFlightParams` and `JumpTunnelForcesParams`.
- **Power/resource components:** resource network pools, maximum/default distribution, conversion rates, state power ranges, and functionality multipliers.
- **Emissions/detection:** radar contact type, base signatures, tagged signatures, emission modifiers, and per-state EM/IR nominal values.
- **Reliability:** health, damage resistances, distortion thresholds, misfire probabilities/effects, operating temperatures, overheat limits, and self-repair ratios.
- **Hardpoint compatibility:** port min/max size, accepted type/subtype, required/forbidden tags, default item, child loadout, and parent resource links.
- **Mining/salvage/tractor attachments:** dedicated component variants contain extraction, fracture, salvage, and tractor modifiers; retain unknown variant payloads until each component family has a typed extractor.

`SCItemManufacturer` (1,160 records) at `libs/foundry/records/scitemmanufacturer/**` provides `Code`, localized manufacturer data, logos, UI styling, dashboard configuration, and audio manufacturer tags. A large share are paint/shop variants, so deduplicate by GUID and use only referenced manufacturer records in the primary manufacturer table.

### Weapons and ammunition

Weapon entities expose:

- fire actions and fire modes;
- ammo containers, ammo cost, regeneration, and magazine/default loadout references;
- base, overpowered, underpowered, and overclocked damage/fire-rate modifiers;
- recoil, spread, aim, heat, misfire, and regeneration modifiers;
- AI ideal/max range and accuracy curves;
- item ports for scopes, barrels, magazines, and other attachments.

`AmmoParams` (242 records) at `libs/foundry/records/ammoparams/**` provides projectile-level data: `ammoCategory`, `bulletType`, `displayName`, `speed`, `lifetime`, `hitPoints`, `impulseScale`, projectile dimensions/mass, resource conversion rate, and projectile behavior. Join weapon fire actions to ammo definitions rather than deriving projectile behavior from the weapon alone.

### Armor, inventory, consumables, and medical data

Useful companion records:

| Record type                                   | Path                                                                    | Useful fields                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `InventoryContainer` (583)                    | `libs/foundry/records/inventorycontainers/**`                           | capacity in microSCU, interior dimensions, inventory type, excluded subtypes |
| `DamageResistanceMacro` (12)                  | `libs/foundry/records/damage/**`                                        | damage and impact-force resistance presets                                   |
| `MoveViewRestrictionPenalty` (5)              | `libs/foundry/records/moveviewrestrictionpenalties/armor/**`            | movement/view penalties by armor class                                       |
| `ConsumableType` / `ConsumableSubtype` (6/83) | `libs/foundry/records/consumabletypesdatabase/consumabletypes.xml`      | name/type, effects per microSCU, affected stat, point/cooldown change, tint  |
| `MedicalItemTierConfig`                       | `libs/foundry/records/actorstatuscomponent/medicaltieritemconfig.xml`   | drug types, efficacy, med-bed tiers, resource consumption                    |
| `ActorStatusGlobalParams`                     | `libs/foundry/records/actorstatuscomponent/globalactorstatusparams.xml` | status effects, buffs, drug type, overdose/revival settings                  |

Entity components add physical mass, inventory footprint, temperature limits, resistance, health, consumable capacity/content, and reusable/reclosable behavior.

### Vehicles and default loadouts

Ship entities under `entities/spaceships/` expose more than name and manufacturer:

- localized `vehicleName` and `vehicleDescription`;
- `vehicleCareer`, `vehicleRole`, and references to canonical career/role records;
- `crewSize`, `crewManifest`, cargo entry dimensions, and cargo manifest overrides;
- object-container file references and bones;
- item ports, hardpoint constraints, and recursively nested default loadouts;
- hull damage normalization, component penetration multipliers, shield SDF settings, and damage behavior;
- physics grid and room/resource network setup;
- bounding dimensions, mass, interaction points, seats, doors, landing gear, cargo grids, and docking ports.

`VehicleCareer` (11) and `VehicleRole` (60) under `libs/foundry/records/vehicle/` provide localized career/role taxonomies. Store them as many-to-many classifications, not one free-text vehicle category.

Default equipment is represented by item-port/default-loadout components in the entity. Preserve the port tree:

```text
vehicle -> item port -> installed entity class -> child item ports -> installed entity class
```

This supports stock loadout comparison, compatibility queries, component counts, and installed weapon/ammo calculations.

### P4K vehicle definitions

`Data/Scripts/Entities/Vehicles/Implementations/Xml/*.xml` are CryXmlB despite the `.xml` extension. Parse them with `starbreaker-cryxml`; do not use a UTF-8 XML parser directly.

A representative ship definition contains additional fields not convenient in the entity record:

| Node                                  | Useful attributes                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Vehicle`                             | `id`, `name`, `displayname`, `size`, `subType`, item-port/required tags, landing offset, debris behavior         |
| `Spaceship`                           | maximum angular acceleration/velocity, directional/engine/retro thrust, rotation damping, ignition/warmup values |
| `Physics` / `Simulation`              | freefall damping, pushability, max time step, minimum energy                                                     |
| `Part`                                | part ID/name/class, mass, health (`damageMax`), detach probability/forces, scope context                         |
| `ItemPort`                            | ID, display name, min/max size, required/port tags, default weapon group, grid behavior                          |
| `DamageMultiplier`                    | physical/energy/distortion multipliers by damage type                                                            |
| `Damages`                             | collision and submerged damage tuning                                                                            |
| `DamageBehavior`, `Explosion`, `Burn` | trigger thresholds and damage/effect values                                                                      |
| `Helper`                              | named part positions/directions                                                                                  |

Treat this as a supplemental vehicle-physics table keyed by the vehicle definition/entity linkage. DataCore should remain the source for identity and most references.

## Economy, shops, rentals, and cargo

### Shop inventory defaults

`Data/Scripts/ShopInventories/*.json` contains static shop inventory snapshots/defaults. A current file has this shape:

```json
{
	"ShopID": "guid[,guid...]",
	"Collection": {
		"Inventory": [
			{
				"ID": { "ID": ["item-or-resource-guid"] },
				"BuyPrice": 0.01,
				"SellPrice": 11.92,
				"CurrentInventory": 3817.8,
				"MaxInventory": 7500.0,
				"RentalOfferings": []
			}
		]
	}
}
```

Extract:

- inventory filename and all `ShopID` values;
- item/resource ID array;
- buy and sell prices;
- current/default and maximum inventory;
- rental offering duration and price fields when present;
- build/changelist provenance.

Warnings:

- These are client defaults, not authoritative live server stock or current dynamic prices.
- `ShopID` may identify placed shop entities rather than DataCore records. Preserve unresolved IDs.
- A zero buy or sell value commonly means that transaction direction is unavailable; do not automatically treat it as a free item.

### Physical shop and location join

`Data/ObjectContainers/PU/Shops/**/*.socpak` contains physical shop instances (259 relevant packages in the inspected build). Parse every inner SOC/XML entry, not only the package's `ChildObjectContainers` file. Locate `SCShop` entities and inventory references, retain their local transform, then join the surrounding object-container hierarchy to a starmap location.

The current `readSocpak` addon API only returns child object containers. It must be expanded before it can extract shop terminals/entities and other SOC contents.

### Global economy rules

DataCore records under `libs/foundry/records/globalshopparams/` provide:

| Record                      | Useful fields                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GlobalShopBuyingParams`    | licensed-item modifiers and tutorial limits                                                          |
| `GlobalShopSellingParams`   | item-type modifiers, wear curve, match/no-match percentages, inventory curve, mission-item reduction |
| `GlobalShopCommodityParams` | demand/supply thresholds, autoloading prices, supported resource container types, generic crates     |
| `GlobalShopTerminalParams`  | categories, pagination/query type, UI errors                                                         |

Other useful records:

- `ShopFranchise` (37): localized franchise name.
- `ItemKioskBrand` (38): brand name, logo, and color.
- `GlobalCargoLoadingParams`: loading/unloading time per box/SCU and transfer timeout behavior.
- `PlayerTradeGlobalParams`: currency labels, tax rate, limits, and trade timing.
- `RefiningProcess` (9): process name, refining speed, and output quality.

### Cargo and crew manifests

`CargoManifest` (82) under `libs/foundry/records/cargomanifest/**` describes generated vehicle cargo:

- minimum/maximum fill capacity;
- candidate resource GUID and probability;
- cargo spawn rules;
- description/classification tags;
- whether cargo grids lock on spawn.

`CrewManifest` (57) under `libs/foundry/records/crewmanifest/**` describes generated crews:

- archetype and entity class;
- outfit and character tags;
- DNF/query terms;
- manifest description tags.

These are useful for encounter/NPC-ship analysis and expected cargo generation, but they are weighted generation rules rather than guaranteed contents.

## Crafting, dismantling, and quality

The inspected build contains a substantial current crafting model rather than only the legacy salvage filler recipes.

### Blueprint definitions

`CraftingBlueprintRecord` (1,608) is located at:

```text
libs/foundry/records/crafting/blueprints/**
```

The path separates creation/crafting and dismantling records. Extract:

| Field                                             | Use                                                  |
| ------------------------------------------------- | ---------------------------------------------------- |
| `blueprint.blueprintName`                         | Localized blueprint name                             |
| `blueprint.category`                              | Category GUID/reference                              |
| `blueprint.processSpecificData._Type_`            | Creation vs dismantling process                      |
| `processSpecificData.entityClass`                 | Created item/entity class                            |
| `processSpecificData.dismantleTime`, `efficiency` | Dismantling duration/yield                           |
| `blueprint.tiers[]`                               | Tiered recipes and research requirements             |
| `tiers[].recipe.costs.craftTime`                  | Days/hours/minutes/seconds                           |
| `mandatoryCost`, `optionalCosts`                  | Required and optional ingredient groups              |
| cost `_Type_`                                     | Resource, item, selection, or other polymorphic cost |
| cost `quantity`                                   | Item count or SCU/cSCU/microSCU volume               |
| cost `minQuality`                                 | Minimum input quality                                |
| cost `resource` / `entityClass`                   | Ingredient reference                                 |
| `recipe.results`                                  | Explicit result list when populated                  |
| tier `research`                                   | Unlock/research requirements when populated          |

Creation output can be implied by `blueprint.processSpecificData.entityClass` even when `recipe.results` is null.

Selection costs are nested trees. For example, a mandatory `CraftingCost_Select` may require three named aspects, each with alternative resource/item options. Preserve group count, option count, context rules, debug/display names, and the complete tree; flattening directly to ingredients loses substitution semantics.

Recommended normalized shape:

```text
crafting_blueprint
crafting_tier
crafting_recipe
crafting_cost_node (parent_id, type, count, min_quality, context, name)
crafting_cost_option (ordered child relationship)
crafting_result
crafting_research_requirement
```

### Categories, rewards, and unlocks

| Record type                                                   | Path                                                         | Useful fields                             |
| ------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `BlueprintCategoryDatabaseRecord` / `BlueprintCategoryRecord` | `crafting/blueprintcategories/blueprintcategorydatabase.xml` | category tree and embedded category GUIDs |
| `BlueprintPoolRecord` (154)                                   | `crafting/blueprintrewards/**`                               | weighted/pooled blueprint rewards         |
| mission contract result `BlueprintRewards`                    | contract generator/template payloads                         | reward pool and chance                    |

This permits joins from mission -> blueprint pool -> blueprint -> created entity.

### Crafted properties and quality

| Record type                                  | Useful fields                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `CraftingGameplayPropertyDef` (29)           | property path/name, localization override, display transformation, unit format |
| `CraftingQualityDistributionRecord` (10)     | source quality distribution                                                    |
| `CraftingQualityLocationOverrideRecord` (12) | location-specific quality overrides                                            |
| `CraftingQualityQuantizationRecord` (38)     | quality band start/end and mapped value                                        |
| `CraftingGlobalParams`                       | default selection/quality, dismantle blacklists, refining quality multiplier   |

Quality values should be stored as source integers/floats without assuming a fixed 0-100 or 0-1 scale. The inspected recipe uses values such as `800` and `900` for minimum quality.

### Legacy crafting

`LegacyCraftingRecipeDefRecord` (34) and `LegacyCraftingRecipeListRecord` (5) live under `libs/foundry/records/crafting/legacy/**`. Import these into separate legacy tables or tag them with a generation/version; do not merge them blindly with `CraftingBlueprintRecord` recipes.

## Resources, mining, harvestables, and refining

### Resource taxonomy

`ResourceTypeDatabase` at `libs/foundry/records/resourcetypedatabase/resourcetypedatabase.xml` contains:

- `ResourceTypeGroup` (19): nested groups, localized name/description, default thumbnails;
- `ResourceType` (207): localized name/description, density in grams per cubic centimeter, resource properties, refined-version reference, default cargo containers, thumbnails, and RTT entity class.

Use the resource GUID as the common key across commodities, mining, crafting, cargo manifests, laws, and shops.

### Mineables

| Record type                 | Path                               | Useful fields                                                                                                                     |
| --------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `MineableElement` (46)      | `mining/mineableelements/**`       | resource reference, resistance, instability, optimal-window midpoint/thinness/randomness, explosion multiplier, clustering factor |
| `MineableComposition` (249) | `mining/rockcompositionpresets/**` | element, probability, min/max percentage, quality scale, curve exponent, minimum distinct elements, deposit name                  |
| `MiningGlobalParams`        | `mining/miningglobalparams*.xml`   | fracture/explosion tuning, optimal window, resistance curve, power capacity, waste resource                                       |

This supports resource occurrence, rock-composition ranges, extraction difficulty, and expected-yield models. Probabilities and composition ranges are generation inputs, not observed deposits.

### Harvestables and world distribution

| Record type                                                                | Useful fields                                                                                              |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `HarvestableProviderPreset` (49)                                           | areas, weighted harvestable groups, entity/setup reference, geometry tag, clustering, relative probability |
| `HarvestablePreset` (571)                                                  | entity class, behavior, respawn time, transform, sub-configuration                                         |
| `HarvestableClusterPreset` (28)                                            | cluster probability and cluster parameters                                                                 |
| `HarvestableSetup` (30)                                                    | behavior, respawn, transform and sub-configuration                                                         |
| `SubHarvestableConfigRecord` / `SubHarvestableMultiConfigRecord` (118/103) | nested slot/loot generation configuration                                                                  |

Provider paths include system/body names, for example `harvestable/providerpresets/system/stanton/**`. Join path-derived scope and explicit area/tag references to starmap locations cautiously; path naming is useful provenance, not a durable foreign key.

### Refining

`RefiningProcess` supplies method name, speed, and quality. Resource records supply `refinedVersion`. Crafting global parameters provide a refining quality multiplier. Static client data does not provide authoritative refinery job prices or live queue times.

## Loot generation

The client has both legacy and V3 loot records.

### V3 model

| Record type                                    | Path                                 | Useful fields                                                                |
| ---------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `LootArchetypeV3Record` (34)                   | `lootgeneration/lootarchetypes/v3*`  | entries, selector, positive/negative tags, optional data, weight, debug name |
| `LootTableV3Record` (59)                       | `lootgeneration/loottables/v3*`      | archetype reference, weight, duplicate limit, optional data                  |
| `LootV3SecondaryChoicesSingleLayerRecord` (10) | `lootgeneration/secondarychoices/**` | weighted choices such as rarity, faction, manufacturer                       |
| `LootV3SecondaryChoicesMultiLayerRecord` (15)  | same                                 | layered secondary choices                                                    |
| `PoolFilterRecord` (15)                        | `lootgeneration/filters/**`          | inclusion/exclusion filter                                                   |

Resolve selectors through entity tags and attachment type/subtype. A useful database needs both the raw selector and a materialized set of matching entity GUIDs per build.

### Legacy model

`LootArchetype` (233) and `LootTable` (161) remain in the build. Keep model version on every loot table/archetype. Do not interpret weights as direct percentages until all sibling weights and selection layers are known.

### Placement join

Loot tables become spatially useful through harvestable/sub-harvestable slot presets and placed SOC entities. Extract loot-container entities from relevant object containers and join their setup/table references to a location. Static data describes possible loot, not guaranteed spawn contents.

## Missions, contracts, rewards, and mission locations

There are multiple overlapping mission systems. Import them separately and link where references exist.

### Mission broker records

`MissionBrokerEntry` (2,584) under `libs/foundry/records/missionbroker/pu_missions/**` is the richest player-facing mission definition in this build.

Useful fields include:

- localized `title`, `titleHUD`, and `description`;
- mission `type`, tags, owner, giver/giver record, module, and flow;
- `lawfulMission`, prison availability, criminal/prison failure behavior;
- sharing and player-count limits;
- initial/request/invitation/offer visibility flags;
- buy-in, base reward, partial payout, completion perk;
- reputation prerequisites, requirements, and result rewards;
- required/associated/linked missions and required completion tags;
- cooldown, respawn, instance lifetime, and deadline values plus variations;
- availability date schedule, locality, required/excluded area tags, and location availability;
- objective tokens, journal entries, completion tags, and modifiers;
- `notForRelease`, `workInProgress`, and tutorial flags.

Store release/WIP flags and filter at query time. Do not discard unreleased definitions during ingestion.

### Contract generators and templates

| Record type                     | Path                                      | Useful fields                                                                                         |
| ------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ContractGenerator` (109)       | `contracts/contractgenerator/**`          | generated contracts, intro contracts, base params, required scenarios, release status                 |
| `ContractTemplate` (494)        | `contracts/contracttemplates/**`          | class, owner, display info, properties, objectives, flow, modifiers, start/end comms, payout behavior |
| `ContractDifficultyProfile` (7) | `contracts/contractdifficultyprofiles/**` | knowledge, mechanical skill, mental load, and risk weights                                            |
| `MissionType` (41)              | `missiontype/**`                          | localized type name, icon/SVG, display time                                                           |

Generator contracts contain parameter overrides for title, description, contractor, legality, and other properties. Apply template/base values first and overrides last, while retaining both source layers for debugging.

### Mission actors and spatial rules

| Record type                                          | Useful fields                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `MissionGiver` (23)                                  | display name/description, entity class, headquarters, reputation, allies/enemies, cooldowns |
| `MissionOrganization` (69)                           | faction reputation, tags, weighted/localized variants                                       |
| `MissionLocality` (20)                               | available locations                                                                         |
| `MissionLocationTemplate` (2,104)                    | location selection data and constraints                                                     |
| `LocationEntityDeclaration` / `LocationResourceSlot` | required location entities and consumable resource slots                                    |
| `MissionItem` (225)                                  | entity class, tags, weighted string variants                                                |
| `MissionModuleHierarchy` / `ModuleDeclaration`       | mission module tree, variables, location/spawned entities                                   |
| `MissionScenario` / `ScenarioProgress`               | schedules, cycles, progress and reward tiers                                                |
| `AIWaveCollection` (184)                             | weighted/composed AI encounter waves                                                        |

### Rewards

Mission and contract payloads may contain:

- UEC/base reward and partial payout;
- reputation reward records (`SReputationRewardAmount`);
- item award weighting (`ItemAwardWeightingsRecord`);
- blueprint reward pools and chance;
- scenario multiplier/reward tiers;
- completion perks and journal entries.

Model rewards as polymorphic rows with their original `_Type_`, not a fixed UEC-only column set.

### Subsumption files

`Data/Scripts/AI/Subsumption/**/*.xml` contains mission/AI graph assets (252 relevant XML files in the inspected inventory). These are useful for deep objective-flow analysis, but DataCore mission broker/template records are a better first implementation because they already expose player-facing metadata and stable references.

## Factions, reputation, organizations, and law

### Factions and relationships

`Faction` (59) under `libs/foundry/records/factions/**` contains:

- localized name/description and faction type;
- default reaction;
- ally/enemy faction references;
- reputation reference;
- arrest, legal-rights, criminality, and trespass-policing flags;
- friendly-fire behavior overrides.

`Faction_LEGACY` (27) is a separate legacy model. Preserve it only for content that still references it.

### Reputation model

| Record type                       | Useful fields                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `FactionReputation` (38)          | name/display name, logo, allies/enemies, allied/hostile scope and standing, NPC/visibility flags, perk reward list, sandbox triggers |
| `SReputationScopeParams` (46)     | scope name, localized name/description, icon, standing map                                                                           |
| `SReputationStandingParams` (380) | localized tier name/description/perk, minimum reputation, gated flag, drift target/time, icon                                        |
| `SReputationRewardAmount` (58)    | editor label and reputation delta                                                                                                    |
| `SPerkReputationListParams`       | perk definitions/references                                                                                                          |
| `SReputationContextUI` (27)       | UI scope grouping and order                                                                                                          |

The join is broadly:

```text
faction/organization -> reputation -> scope -> ordered standings
mission result -> reputation amount -> affected reputation/scope
standing -> perks
```

Do not infer ordering from names such as `Junior` or `Senior`; order by `minReputation` within the referenced standing map.

### Jurisdictions and crime

`Jurisdiction` (13) under `libs/foundry/records/lawsystem/jurisdictions/**` contains:

- parent jurisdiction, name/logo, prison and inheritance flags;
- base fine and early-payment period;
- infractions and parameter overrides, including fines, felony merits, grace/cooloff behavior, and journal visibility;
- impounding definitions, fine, duration, and trigger;
- prohibited goods/resources;
- controlled-substance classes and maximum legal possession in SCU;
- maximum stolen-goods possession.

`InfractionDefinition` (43) supplies localized offense name/description, default parameters, and triggers. Join starmap `jurisdiction` references to determine which laws apply at a location.

`SecurityNetworkManifest` (81), room settings (70), and clearance tokens (41) describe territory protocols, trespass timing, hostility rules, and mission/security access. They are useful for facility-level law/security metadata.

## Locations and environmental data

### Solar systems and starmap records

| Record type               | Count | Useful fields                                                                                                              |
| ------------------------- | ----: | -------------------------------------------------------------------------------------------------------------------------- |
| `SSolarSystem`            |     3 | system name, galactic position, default location, starmap record, landing-zone inventory                                   |
| `StarMapObject`           | 2,069 | name/description, parent, type, size, affiliation, jurisdiction, amenities, imagery, visibility, scan/travel/respawn flags |
| `StarMapObjectType`       |    21 | classification, surface flag, selectable, spawn-nav-point and valid-quantum-destination flags, presentation                |
| `StarMapAmenityTypeEntry` |    25 | amenity name, localized display name, icon                                                                                 |

Useful `StarMapObject` fields beyond the existing location name/type/parent model:

- `affiliation` and `jurisdiction`;
- `amenities`;
- `locationImagePath`, `locationMedicalImagePath`, preview icon/image;
- `isScannable`, `blockTravel`, `quantumTravelData`;
- `respawnLocationType`, `noAutoBodyRecovery`;
- `hideInStarmap`, `hideInWorld`, neighbor/selection/orbit settings;
- `radarProperties` and map marker/navigation presentation;
- whether the location is exposed for player-created missions.

### Placement and transforms

DataCore describes the object, but SOCpak object containers provide actual transforms and hierarchy. Start from the `MegaMap` universe record, follow each `SSolarSystem` object-container path, recursively parse child containers, and use each child's `starMapRecord` attribute to join it to a `StarMapObject`.

Relevant P4K families include:

```text
Data/ObjectContainers/PU/system/**
Data/ObjectContainers/PU/station/**
Data/ObjectContainers/PU/jumpPoint/**
Data/ObjectContainers/PU/loc/**
Data/ObjectContainers/PU/surfaceop/**
Data/ObjectContainers/PU/Shops/**
```

Store position, quaternion rotation, scale when available, source container, and transform frame. Galactic system positions, solar-system object-container transforms, and surface-local coordinates are different frames and must not be mixed into one untyped coordinate column.

### Location inventories and interiors

- `LandingZoneInventory` provides location redirects and inventory container parameters.
- `InstancedInteriorLocationMap` / `InstancedInteriorLocationParams` provides interior-to-location relationships, default hangars, exit buffers, and development flags.
- `InteriorMapSectionDefinition` (221) provides localized interior section names and map bounds.
- `LandingPadSize` maps ship/ground-vehicle sizes to pad categories.
- RaSTaR library records expose modular location elements and file paths.

### Environment and habitability

Useful location-adjacent records include:

| Record family                                  | Data available                                            |
| ---------------------------------------------- | --------------------------------------------------------- |
| `PlanetDayNightTemperatureTemplate`            | body-specific day/night temperatures                      |
| `AtmosphereStateTemplate`                      | atmosphere state per body/system                          |
| `AtmosphericCompositionTemplate`               | gas composition                                           |
| `GasParams`                                    | chemical symbol, fog/density data                         |
| `AtmosphereBehavior`                           | humidity, pressure, temperature, weather, vehicle effects |
| `RadiationStateTemplate` / `RadiationBehavior` | EM/IR/cross-section radiation state and surface behavior  |
| `AsteroidFieldComposition`                     | asteroid composition and fog properties                   |
| `HarvestableProviderPreset`                    | local resource/harvestable distribution                   |

Relationships are often indirect through room/object-container components or path scope. Keep provenance and confidence on inferred body/location joins.

### Transit

DataCore provides `TransportDestinationCategory`, icon types, carriage announcements, and transit audio. Route/station geometry and operational links are primarily in SOCpak entities, including `Data/ObjectContainers/Setup/transport_system/**` and transit objects in city/station containers.

Future extraction should capture:

- transit manager/system ID;
- gateway, destination, and carriage IDs;
- display/localized destination name and category;
- connected stops and route order;
- wait/travel timing where configured;
- world transform and parent location;
- announcement references.

This requires general SOC entity parsing beyond the current child-container-only API.

## Scanning, radar, signatures, and discoverability

This data can support component/vehicle detection and scan-result databases:

| Record type                       | Useful fields                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `RadarContactTypeEntry` (58)      | display name, tag, scan definition, marker, tracker type, detection constraints     |
| `RadarSignatureCategoryEntry`     | category display/name                                                               |
| `RadarSystemSharedParams`         | radar range/angles, occlusion, ping, scan, tagging, jamming, delta-signature tuning |
| `ScanInformationDef` (21)         | scan layout and procedures                                                          |
| `ScanCustomDataDef` (15)          | custom scan information                                                             |
| entity radar/signature components | contact type, EM/IR signatures, tagged signatures, emission modifiers               |

Join emitted signature values from entity/component states with sensor/radar parameters. Keep nominal source values; effective detection range requires gameplay formulas and environmental state not represented by a simple direct field.

## Journal, lore, UI metadata, and communication

Potentially useful secondary datasets:

- `JournalEntry` (199): localized title/subheading/content type, mission linkage, notification behavior.
- `MobiGlasAppData` (81): in-game emails/files and app payloads.
- `CommsNotification` (869): communication character, stage, tags, communication name.
- `DialogueContent` / `DialogueContext`: localized subtitle text, speaker, audio trigger/source, tags.
- `HintUIData`: localized tutorial title/body and media.
- `SpecialEventDatabase`: event days and manufacturer schedules.

These records are high-volume and localization-heavy. Import them after core entity/economy/location relationships unless the product explicitly needs lore or dialogue search.

## Localization

Use `Data/Localization/<language>/global.ini`. Keys are case-insensitive; strip one leading `@`. Preserve both key and resolved value.

```rust
fn parse_localization(data: &[u8]) -> std::collections::HashMap<String, String> {
  String::from_utf8_lossy(data)
    .lines()
    .filter_map(|line| {
      let line = line.trim_start_matches('\u{feff}').trim();
      if line.is_empty() || line.starts_with(';') || line.starts_with('#') {
        return None;
      }
      let (key, value) = line.split_once('=')?;
      Some((key.trim().to_ascii_lowercase(), value.trim().to_owned()))
    })
    .collect()
}
```

Do not permanently replace localization keys with English text. Recommended shape:

```text
localized_text(owner_kind, owner_id, field, locale, localization_key, value, build_id)
```

Values such as `@LOC_PLACEHOLDER`, `#!missing`, and unresolved keys should remain visible as data-quality flags.

## Recommended database foundation

All domain tables should carry `build_id`, source record GUID, source path, source type, and an optional raw JSON payload.

Suggested shared tables:

```text
game_build
source_record
source_reference
localized_text
tag
record_tag
entity
entity_component
entity_item_port
entity_default_loadout
manufacturer
resource_type
location
location_transform
```

Domain tables can then reference stable source GUIDs:

```text
item_spec / weapon_spec / ammo_spec / component_spec / vehicle_spec
shop / shop_inventory / rental_offering
crafting_blueprint / crafting_tier / crafting_cost_node / crafting_result
mineable_element / mineable_composition / harvestable_distribution
loot_table / loot_archetype / loot_selector
mission / mission_template / mission_reward / mission_requirement
faction / reputation_scope / reputation_standing / jurisdiction / infraction
```

### Import behavior

1. Insert the build manifest.
2. Index every DataCore record and reference before domain extraction.
3. Import localization keys/values.
4. Import base entities, tags, manufacturers, and resources.
5. Import item/vehicle components and recursive loadouts.
6. Import starmap metadata and object-container transforms.
7. Import economy, crafting, mining, loot, reputation/law, and missions.
8. Materialize derived joins only after all source records exist.
9. Record unresolved references instead of dropping rows.
10. Diff by GUID and normalized payload between builds; soft-delete records absent from a newer build.

### Extraction priority

Recommended order by value and implementation cost:

| Priority | Dataset                                          | Reason                                                    |
| -------- | ------------------------------------------------ | --------------------------------------------------------- |
| 1        | Entity/item/component/vehicle specs and loadouts | Broadest reuse; almost entirely DataCore                  |
| 1        | Resources, crafting blueprints, and quality      | Current, well-linked, and product-visible                 |
| 1        | Mission broker entries, rewards, reputation      | Rich player-facing data with direct GUID joins            |
| 2        | Shops and static prices                          | High value but requires P4K JSON plus physical-shop joins |
| 2        | Loot tables and harvestable distribution         | Useful but probabilistic and polymorphic                  |
| 2        | Location amenities, law, environment, interiors  | Extends the existing location model significantly         |
| 3        | Transit graph and placed shop/loot entities      | Requires a general SOC entity parser                      |
| 3        | Dialogue, lore, hints, and Subsumption graphs    | Large volume and lower core-database value                |

## Known limits

- Client data does not provide authoritative live stock, dynamic commodity prices, player-specific availability, or current mission instances.
- Static weights and probabilities are inputs to generation systems, not guaranteed observed outcomes.
- Some records are templates, tests, legacy content, development-only, unreleased, or work in progress. Retain flags and classify rather than deleting them during extraction.
- Filename/path heuristics are useful discovery aids but are not stable keys.
- The current addon resolves many file references, but a complete importer must preserve unresolved references and distinguish DataCore record references from P4K asset paths.
- The current SOCpak API extracts only child-container hierarchy. Shops, transit, loot placement, and many location details require parsing all inner SOC/XML entity data.
- Vehicle CryXmlB and DataCore overlap. Use DataCore for identity/relationships and vehicle XML for supplemental legacy physics/part tuning; retain source precedence explicitly.
