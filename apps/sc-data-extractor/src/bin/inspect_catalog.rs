use std::collections::{BTreeMap, BTreeSet};

use starbreaker_datacore::{database::Database, export};

const PROFILE_TYPES: &[&str] = &[
  "CraftingBlueprintRecord",
  "CraftingQualityQuantizationRecord",
  "ResourceType",
  "MineableElement",
  "MineableComposition",
  "HarvestableProviderPreset",
  "LootArchetypeV3Record",
  "LootTableV3Record",
  "FactionReputation",
  "SReputationStandingParams",
  "Jurisdiction",
  "MissionBrokerEntry",
  "MissionGiver",
  "CargoManifest",
  "CrewManifest",
  "InventoryContainer",
  "RefiningProcess",
  "VehicleCareer",
  "VehicleRole",
  "StarMapObject",
  "StarMapObjectType",
  "ConsumableSubtype",
  "AmmoParams",
];

fn collect_shape(value: &serde_json::Value, path: &str, depth: usize, output: &mut BTreeSet<String>) {
  if depth > 7 {
    return;
  }
  match value {
    serde_json::Value::Object(values) => {
      for (key, value) in values {
        let child_path = if path.is_empty() {
          key.to_owned()
        } else {
          format!("{path}.{key}")
        };
        output.insert(child_path.clone());
        collect_shape(value, &child_path, depth + 1, output);
      }
    }
    serde_json::Value::Array(values) => {
      for value in values {
        collect_shape(value, &format!("{path}[]"), depth + 1, output);
      }
    }
    _ => {}
  }
}

fn print_record_shape(db: &Database<'_>, label: &str, record: &starbreaker_datacore::types::Record) -> Result<(), Box<dyn std::error::Error>> {
  let json = export::to_json(db, record)?;
  let value: serde_json::Value = serde_json::from_slice(&json)?;
  let mut shape = BTreeSet::new();
  collect_shape(&value, "", 0, &mut shape);
  println!(
    "{}\t{}\t{}",
    label,
    db.resolve_string(record.file_name_offset).replace('\\', "/"),
    shape.into_iter().collect::<Vec<_>>().join(",")
  );
  Ok(())
}

fn collect_xml_shape(
  xml: &starbreaker_cryxml::CryXml<'_>,
  node: &starbreaker_cryxml::CryXmlNode,
  output: &mut BTreeMap<String, BTreeSet<String>>,
) {
  let tag = xml.node_tag(node).to_owned();
  output
    .entry(tag)
    .or_default()
    .extend(xml.node_attributes(node).map(|(name, _)| name.to_owned()));
  for child in xml.node_children(node) {
    collect_xml_shape(xml, child, output);
  }
}

fn is_datacore_path(path: &str) -> bool {
  let path = path.replace('/', "\\").to_ascii_lowercase();
  let Some(filename) = path.strip_prefix("data\\") else {
    return false;
  };
  filename.starts_with("game") && filename.ends_with(".dcb") && !filename.contains('\\')
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let p4k = starbreaker_p4k::open_p4k()?;
  eprintln!("P4K: {} ({} entries)", p4k.path().display(), p4k.entries().len());

  let mut p4k_families: BTreeMap<String, usize> = BTreeMap::new();
  for entry in p4k.entries() {
    let lower = entry.name.to_ascii_lowercase();
    if [
      "data\\objectcontainers\\",
      "data\\libs\\foundry\\",
      "data\\scripts\\",
      "data\\localization\\",
      "data\\ui\\",
    ]
    .iter()
    .any(|prefix| lower.starts_with(prefix))
      && [".xml", ".json", ".ini", ".socpak", ".entxml", ".dat"]
        .iter()
        .any(|extension| lower.ends_with(extension))
    {
      let family = entry
        .name
        .split('\\')
        .take(4)
        .collect::<Vec<_>>()
        .join("/");
      *p4k_families.entry(family).or_default() += 1;
    }
  }
  println!("# P4K_FAMILIES");
  for (family, count) in p4k_families {
    println!("{count}\t{family}");
  }

  println!("# P4K_SAMPLES");
  for sample_path in ["Data\\Scripts\\ShopInventories\\Inv_Admin_Area18.json"] {
    if let Some(entry) = p4k.entry_case_insensitive(sample_path) {
      let data = p4k.read(entry)?;
      let text = String::from_utf8_lossy(&data);
      println!("{}\t{}", entry.name, text.chars().take(12_000).collect::<String>().replace('\n', " "));
    }
  }
  if let Some(entry) = p4k.entries().iter().find(|entry| {
    let lower = entry.name.to_ascii_lowercase();
    lower.starts_with("data\\scripts\\entities\\vehicles\\") && lower.ends_with(".xml")
  }) {
    let data = p4k.read(entry)?;
    let xml = starbreaker_cryxml::from_bytes(&data)?;
    let mut shape = BTreeMap::new();
    collect_xml_shape(&xml, xml.root(), &mut shape);
    println!(
      "{}\t{}",
      entry.name,
      shape
        .into_iter()
        .map(|(tag, attributes)| format!("{tag}[{}]", attributes.into_iter().collect::<Vec<_>>().join(",")))
        .collect::<Vec<_>>()
        .join(" | ")
    );
  }

  for entry in p4k.entries().iter().filter(|entry| is_datacore_path(&entry.name)) {
    let data = p4k.read(entry)?;
    let db = Database::from_bytes(&data)?;
    eprintln!("DataCore: {} ({:?})", entry.name, db);

    let mut types: BTreeMap<String, (usize, BTreeSet<String>, BTreeSet<String>)> = BTreeMap::new();
    for record in db.records() {
      let record_type = db.struct_name(record.struct_id()).to_owned();
      let record_path = db.resolve_string(record.file_name_offset).replace('\\', "/");
      let fields = db
        .all_properties(record.struct_index)
        .into_iter()
        .map(|property| db.resolve_string2(property.name_offset).to_owned())
        .collect::<BTreeSet<_>>();
      let item = types.entry(record_type).or_default();
      item.0 += 1;
      if item.1.len() < 4 {
        item.1.insert(record_path);
      }
      item.2.extend(fields);
    }

    println!("# DATACORE_TYPES\t{}", entry.name);
    for (record_type, (count, paths, fields)) in types {
      println!(
        "{count}\t{record_type}\t{}\t{}",
        paths.into_iter().collect::<Vec<_>>().join(" | "),
        fields.into_iter().collect::<Vec<_>>().join(",")
      );
    }

    println!("# DATACORE_SHAPES\t{}", entry.name);
    for wanted_type in PROFILE_TYPES {
      let record = db.records().iter().find(|record| {
        db.struct_name(record.struct_id()) == *wanted_type
          && (*wanted_type != "CraftingBlueprintRecord"
            || db.resolve_string(record.file_name_offset).to_ascii_lowercase().contains("/blueprints/crafting/"))
          && !db.resolve_string(record.file_name_offset).to_ascii_lowercase().contains("template")
      });
      if let Some(record) = record {
        print_record_shape(&db, wanted_type, record)?;
      }
    }

    println!("# ENTITY_SHAPES\t{}", entry.name);
    for (label, needle) in [
      ("spaceship", "/entities/spaceships/"),
      ("ship_component", "/entities/scitem/ships/quantumdrive/"),
      ("fps_weapon", "/entities/scitem/weapons/fps_weapons/"),
      ("armor", "/entities/scitem/characters/"),
      ("commodity", "/entities/commodities/"),
      ("consumable", "/entities/scitem/consumables/"),
    ] {
      if let Some(record) = db.records().iter().find(|record| {
        db.struct_name(record.struct_id()) == "EntityClassDefinition"
          && db.resolve_string(record.file_name_offset).to_ascii_lowercase().contains(needle)
          && !db.resolve_string(record.file_name_offset).to_ascii_lowercase().contains("template")
      }) {
        print_record_shape(&db, label, record)?;
      }
    }
  }

  Ok(())
}