#![deny(clippy::all)]

use std::{
  collections::HashMap,
  sync::{Arc, Mutex, OnceLock},
};

use napi::{Error, Result, Status};
use napi_derive::napi;
use starbreaker_datacore::{database::Database, export, types::CigGuid};

struct DataCoreCache {
  databases: Vec<Database<'static>>,
  record_guids_by_path: HashMap<String, String>,
  record_guids_by_virtual_path: HashMap<String, String>,
}

static DATACORE_CACHE: OnceLock<Mutex<Option<Arc<DataCoreCache>>>> = OnceLock::new();
static P4K_CACHE: OnceLock<Mutex<Option<Arc<starbreaker_p4k::MappedP4k>>>> = OnceLock::new();
static LOCALIZATION_CACHE: OnceLock<Mutex<HashMap<String, Arc<HashMap<String, String>>>>> =
  OnceLock::new();
type SocpakChildrenCache = Mutex<HashMap<String, Arc<Vec<serde_json::Value>>>>;
static SOCPAK_CACHE: OnceLock<SocpakChildrenCache> = OnceLock::new();

fn load_p4k() -> Result<Arc<starbreaker_p4k::MappedP4k>> {
  let cache = P4K_CACHE.get_or_init(|| Mutex::new(None));
  let mut cache = cache.lock().map_err(|_| {
    Error::new(
      Status::GenericFailure,
      "Data.p4k cache lock was poisoned".to_string(),
    )
  })?;

  if let Some(p4k) = cache.as_ref() {
    return Ok(Arc::clone(p4k));
  }

  let p4k = Arc::new(starbreaker_p4k::open_p4k().map_err(|error| {
    Error::new(
      Status::GenericFailure,
      format!("failed to discover and open Data.p4k: {error}"),
    )
  })?);
  *cache = Some(Arc::clone(&p4k));

  Ok(p4k)
}

fn load_datacores() -> Result<Arc<DataCoreCache>> {
  let cache = DATACORE_CACHE.get_or_init(|| Mutex::new(None));
  let mut cache = cache.lock().map_err(|_| {
    Error::new(
      Status::GenericFailure,
      "DataCore cache lock was poisoned".to_string(),
    )
  })?;

  if let Some(datacores) = cache.as_ref() {
    return Ok(Arc::clone(datacores));
  }

  let p4k = load_p4k()?;
  let mut entries: Vec<_> = p4k
    .entries()
    .iter()
    .filter(|entry| is_datacore_path(&entry.name))
    .collect();
  entries.sort_unstable_by_key(|entry| std::cmp::Reverse(datacore_version(&entry.name)));

  if entries.is_empty() {
    return Err(Error::new(
      Status::GenericFailure,
      "no Data\\Game*.dcb files were found in Data.p4k".to_string(),
    ));
  }

  let databases = entries
    .into_iter()
    .map(|entry| {
      let data = p4k.read(entry).map_err(|error| {
        Error::new(
          Status::GenericFailure,
          format!("failed to read DataCore file '{}': {error}", entry.name),
        )
      })?;
      parse_datacore(Box::leak(data.into_boxed_slice()))
    })
    .collect::<Result<Vec<_>>>()?;
  let mut record_guids_by_path = HashMap::new();
  let mut record_guids_by_virtual_path = HashMap::new();
  for db in &databases {
    for record in db.records() {
      let guid = record.id.to_string();
      record_guids_by_path
        .entry(datacore_record_path_key(
          db.resolve_string(record.file_name_offset),
        ))
        .or_insert_with(|| guid.clone());
      record_guids_by_virtual_path
        .entry(record_virtual_path_key(
          db.resolve_string2(record.name_offset),
        ))
        .or_insert(guid);
    }
  }
  let datacores = Arc::new(DataCoreCache {
    databases,
    record_guids_by_path,
    record_guids_by_virtual_path,
  });
  *cache = Some(Arc::clone(&datacores));

  Ok(datacores)
}

fn is_datacore_path(path: &str) -> bool {
  let path = path.replace('/', "\\").to_ascii_lowercase();
  let Some(filename) = path.strip_prefix("data\\") else {
    return false;
  };

  filename.starts_with("game") && filename.ends_with(".dcb") && !filename.contains('\\')
}

fn datacore_version(path: &str) -> u32 {
  let filename = path.rsplit(['\\', '/']).next().unwrap_or(path);
  filename
    .strip_prefix("Game")
    .or_else(|| filename.strip_prefix("game"))
    .and_then(|name| name.strip_suffix(".dcb"))
    .and_then(|version| version.parse().ok())
    .unwrap_or(0)
}

fn normalize_datacore_path(path: &str) -> String {
  let mut components = Vec::new();

  for component in path.split(['\\', '/']) {
    match component {
      "" | "." => {}
      ".." => {
        components.pop();
      }
      component => components.push(component),
    }
  }

  components.join("/")
}

fn datacore_record_path_key(path: &str) -> String {
  let path = normalize_datacore_path(path.strip_prefix("file://").unwrap_or(path));
  path
    .strip_suffix(".json")
    .or_else(|| path.strip_suffix(".xml"))
    .unwrap_or(&path)
    .to_ascii_lowercase()
}

fn record_virtual_path_key(record_name: &str) -> String {
  let Some((record_type, record_name)) = record_name.rsplit_once('.') else {
    return String::new();
  };

  format!("{record_type}/{record_name}").to_ascii_lowercase()
}

fn virtual_path_key(path: &str) -> String {
  let path = datacore_record_path_key(path);
  let Some((directory, filename)) = path.rsplit_once('/') else {
    return String::new();
  };
  let Some(directory_name) = directory.rsplit('/').next() else {
    return String::new();
  };

  format!("{directory_name}/{filename}")
}

fn resolve_file_url(record_path: &str, value: &str) -> Option<String> {
  let path = value.strip_prefix("file://")?;
  let path = path.replace('\\', "/");
  let resolved_path = if path.starts_with('/') {
    normalize_datacore_path(&path)
  } else {
    let directory = record_path
      .rsplit_once(['\\', '/'])
      .map_or("", |(directory, _)| directory);
    normalize_datacore_path(&format!("{directory}/{path}"))
  };

  Some(format!("file:///{resolved_path}"))
}

fn resolve_file_urls(value: &mut serde_json::Value, record_path: &str, datacores: &DataCoreCache) {
  match value {
    serde_json::Value::Array(values) => {
      for value in values {
        resolve_file_urls(value, record_path, datacores);
      }
    }
    serde_json::Value::Object(values) => {
      for value in values.values_mut() {
        resolve_file_urls(value, record_path, datacores);
      }
    }
    serde_json::Value::String(file_url) => {
      let reference = resolve_file_url(record_path, file_url).map(|resolved_url| {
        let path_key = datacore_record_path_key(&resolved_url);
        let guid = datacores
          .record_guids_by_path
          .get(&path_key)
          .or_else(|| {
            datacores
              .record_guids_by_virtual_path
              .get(&virtual_path_key(&path_key))
          })
          .cloned();
        serde_json::json!({
          "path": resolved_url,
          "guid": guid,
        })
      });
      if let Some(reference) = reference {
        *value = reference;
      }
    }
    _ => {}
  }
}

fn export_record(
  db: &Database<'_>,
  record: &starbreaker_datacore::types::Record,
  datacores: &DataCoreCache,
) -> Result<serde_json::Value> {
  let json = export::to_json(db, record).map_err(|error| {
    Error::new(
      Status::GenericFailure,
      format!("failed to export DataCore record: {error}"),
    )
  })?;

  let mut value = serde_json::from_slice(&json).map_err(|error| {
    Error::new(
      Status::GenericFailure,
      format!("DataCore record contained invalid JSON: {error}"),
    )
  })?;
  resolve_file_urls(
    &mut value,
    db.resolve_string(record.file_name_offset),
    datacores,
  );

  Ok(value)
}

fn parse_datacore(data: &[u8]) -> Result<Database<'_>> {
  Database::from_bytes(data).map_err(|error| {
    Error::new(
      Status::InvalidArg,
      format!("failed to parse DataCore file: {error}"),
    )
  })
}

fn parse_localization(data: &[u8]) -> HashMap<String, String> {
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

fn load_localization(language: &str) -> Result<Arc<HashMap<String, String>>> {
  let language = language.trim().to_ascii_lowercase();
  if language.is_empty()
    || !language
      .bytes()
      .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
  {
    return Err(Error::new(
      Status::InvalidArg,
      format!("invalid localization language '{language}'"),
    ));
  }

  let cache = LOCALIZATION_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
  if let Some(localization) = cache
    .lock()
    .map_err(|_| {
      Error::new(
        Status::GenericFailure,
        "localization cache lock was poisoned",
      )
    })?
    .get(&language)
    .cloned()
  {
    return Ok(localization);
  }

  let p4k = load_p4k()?;
  let path = format!("Data\\Localization\\{language}\\global.ini");
  let entry = p4k.entry_case_insensitive(&path).ok_or_else(|| {
    Error::new(
      Status::InvalidArg,
      format!("localization language '{language}' was not found in Data.p4k"),
    )
  })?;
  let data = p4k.read(entry).map_err(|error| {
    Error::new(
      Status::GenericFailure,
      format!("failed to read localization file '{}': {error}", entry.name),
    )
  })?;
  let localization = Arc::new(parse_localization(&data));
  cache
    .lock()
    .map_err(|_| {
      Error::new(
        Status::GenericFailure,
        "localization cache lock was poisoned",
      )
    })?
    .insert(language, Arc::clone(&localization));

  Ok(localization)
}

fn parse_object_container_child(
  xml: &starbreaker_cryxml::CryXml<'_>,
  node: &starbreaker_cryxml::CryXmlNode,
) -> serde_json::Value {
  let mut child = serde_json::Map::from_iter(
    xml
      .node_attributes(node)
      .map(|(key, value)| (key.to_owned(), serde_json::Value::String(value.to_owned()))),
  );
  let children = xml
    .node_children(node)
    .find(|node| xml.node_tag(node) == "ChildObjectContainers")
    .map(|container| {
      xml
        .node_children(container)
        .filter(|node| xml.node_tag(node) == "Child")
        .map(|node| parse_object_container_child(xml, node))
        .collect::<Vec<_>>()
    })
    .unwrap_or_default();
  child.insert("children".to_owned(), serde_json::Value::Array(children));
  serde_json::Value::Object(child)
}

fn parse_object_container_children(data: &[u8]) -> Result<Vec<serde_json::Value>> {
  if !starbreaker_cryxml::is_cryxmlb(data) {
    let xml = std::str::from_utf8(data).map_err(|error| {
      Error::new(
        Status::InvalidArg,
        format!("SOCpak object-container XML is not UTF-8: {error}"),
      )
    })?;
    let document = roxmltree::Document::parse(xml).map_err(|error| {
      Error::new(
        Status::InvalidArg,
        format!("failed to parse SOCpak object-container XML: {error}"),
      )
    })?;
    return Ok(
      document
        .root_element()
        .children()
        .find(|node| node.has_tag_name("ChildObjectContainers"))
        .map(|container| {
          container
            .children()
            .filter(|node| node.has_tag_name("Child"))
            .map(parse_plain_object_container_child)
            .collect()
        })
        .unwrap_or_default(),
    );
  }

  let xml = starbreaker_cryxml::from_bytes(data).map_err(|error| {
    Error::new(
      Status::InvalidArg,
      format!("failed to parse SOCpak object-container XML: {error}"),
    )
  })?;
  let children = xml
    .node_children(xml.root())
    .find(|node| xml.node_tag(node) == "ChildObjectContainers")
    .map(|container| {
      xml
        .node_children(container)
        .filter(|node| xml.node_tag(node) == "Child")
        .map(|node| parse_object_container_child(&xml, node))
        .collect()
    })
    .unwrap_or_default();
  Ok(children)
}

fn parse_plain_object_container_child(node: roxmltree::Node<'_, '_>) -> serde_json::Value {
  let mut child = serde_json::Map::from_iter(node.attributes().map(|attribute| {
    (
      attribute.name().to_owned(),
      serde_json::Value::String(attribute.value().to_owned()),
    )
  }));
  let children = node
    .children()
    .find(|node| node.has_tag_name("ChildObjectContainers"))
    .map(|container| {
      container
        .children()
        .filter(|node| node.has_tag_name("Child"))
        .map(parse_plain_object_container_child)
        .collect()
    })
    .unwrap_or_default();
  child.insert("children".to_owned(), serde_json::Value::Array(children));
  serde_json::Value::Object(child)
}

fn canonical_socpak_path(path: &str) -> String {
  let path = path.replace('\\', "/");
  let path = path
    .split_once('/')
    .filter(|(component, _)| component.eq_ignore_ascii_case("data"))
    .map_or(path.as_str(), |(_, path)| path);
  format!("Data/{path}")
    .replace('/', "\\")
    .to_ascii_lowercase()
}

fn parse_socpak_children(data: &[u8], socpak_path: &str) -> Result<Vec<serde_json::Value>> {
  let socpak = starbreaker_p4k::P4kArchive::from_bytes(data).map_err(|error| {
    Error::new(
      Status::InvalidArg,
      format!("failed to parse SOCpak file '{socpak_path}' from Data.p4k: {error}"),
    )
  })?;
  let package_name = socpak_path
    .rsplit(['\\', '/'])
    .next()
    .and_then(|name| name.strip_suffix(".socpak"))
    .ok_or_else(|| Error::new(Status::InvalidArg, "SOCpak path has no .socpak filename"))?;
  let object_container_xml_name = format!("{package_name}.xml");
  let object_container_xml_entry = socpak.entries().iter().find(|entry| {
    entry
      .name
      .rsplit(['\\', '/'])
      .next()
      .is_some_and(|name| name.eq_ignore_ascii_case(&object_container_xml_name))
  });

  object_container_xml_entry
    .map(|object_container_xml_entry| {
      let object_container_xml = socpak.read(object_container_xml_entry).map_err(|error| {
        Error::new(
          Status::GenericFailure,
          format!(
            "failed to read '{}' from SOCpak '{}': {error}",
            object_container_xml_entry.name, socpak_path
          ),
        )
      })?;
      parse_object_container_children(&object_container_xml)
    })
    .transpose()
    .map(|children| children.unwrap_or_default())
}

fn read_socpak_with_loader<F>(
  socpak_path: &str,
  cache: &SocpakChildrenCache,
  loader: F,
) -> Result<serde_json::Value>
where
  F: FnOnce(&str) -> Result<Vec<u8>>,
{
  let canonical_path = canonical_socpak_path(socpak_path);
  let mut cache = cache.lock().map_err(|_| {
    Error::new(
      Status::GenericFailure,
      "SOCpak cache lock was poisoned".to_string(),
    )
  })?;
  let children = if let Some(children) = cache.get(&canonical_path) {
    Arc::clone(children)
  } else {
    let data = loader(&canonical_path)?;
    let children = Arc::new(parse_socpak_children(&data, &canonical_path)?);
    cache.insert(canonical_path, Arc::clone(&children));
    children
  };

  Ok(serde_json::json!({
    "path": socpak_path,
    "children": children.as_ref(),
  }))
}

#[napi]
pub fn read_socpak(socpak_path: String) -> Result<serde_json::Value> {
  let cache = SOCPAK_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
  read_socpak_with_loader(&socpak_path, cache, |canonical_path| {
    let p4k = load_p4k()?;
    let entry = p4k.entry_case_insensitive(canonical_path).ok_or_else(|| {
      Error::new(
        Status::GenericFailure,
        format!("SOCpak file '{socpak_path}' was not found in Data.p4k"),
      )
    })?;
    p4k.read(entry).map_err(|error| {
      Error::new(
        Status::GenericFailure,
        format!(
          "failed to read SOCpak file '{}' from Data.p4k: {error}",
          entry.name
        ),
      )
    })
  })
}

#[napi]
pub fn lookup_localization(identifier: String, language: Option<String>) -> Result<Option<String>> {
  let localization = load_localization(language.as_deref().unwrap_or("english"))?;
  let key = identifier
    .strip_prefix('@')
    .unwrap_or(&identifier)
    .to_ascii_lowercase();
  Ok(localization.get(&key).cloned())
}

#[napi]
pub fn read_datacore_record_by_guid(guid: String) -> Result<serde_json::Value> {
  let datacores = load_datacores()?;
  let guid: CigGuid = guid.parse().map_err(|error| {
    Error::new(
      Status::InvalidArg,
      format!("invalid DataCore GUID: {error}"),
    )
  })?;
  let (db, record) = datacores
    .databases
    .iter()
    .find_map(|db| db.record_by_id(&guid).map(|record| (db, record)))
    .ok_or_else(|| {
      Error::new(
        Status::GenericFailure,
        format!("DataCore record not found for GUID {guid}"),
      )
    })?;

  export_record(db, record, &datacores)
}

#[napi]
pub fn read_datacore_records_by_type(record_type: String) -> Result<Vec<serde_json::Value>> {
  let datacores = load_datacores()?;
  let records = datacores
    .databases
    .iter()
    .flat_map(|db| {
      db.records_by_type_name(&record_type)
        .map(|record| export_record(db, record, &datacores))
    })
    .collect::<Result<Vec<_>>>()?;

  if records.is_empty() {
    return Err(Error::new(
      Status::InvalidArg,
      format!("DataCore record type '{record_type}' was not found"),
    ));
  }

  Ok(records)
}

#[napi]
pub fn read_datacore_record_by_path(record_path: String) -> Result<serde_json::Value> {
  let datacores = load_datacores()?;
  let record_path_key = datacore_record_path_key(&record_path);
  let guid = datacores
    .record_guids_by_path
    .get(&record_path_key)
    .or_else(|| {
      datacores
        .record_guids_by_virtual_path
        .get(&virtual_path_key(&record_path_key))
    })
    .ok_or_else(|| {
      Error::new(
        Status::GenericFailure,
        format!("DataCore record not found for path '{record_path}'"),
      )
    })?;
  let guid: CigGuid = guid.parse().expect("cached DataCore GUID must be valid");
  let (db, record) = datacores
    .databases
    .iter()
    .find_map(|db| db.record_by_id(&guid).map(|record| (db, record)))
    .ok_or_else(|| {
      Error::new(
        Status::GenericFailure,
        format!("DataCore record not found for path '{record_path}'"),
      )
    })?;

  export_record(db, record, &datacores)
}

#[cfg(test)]
mod tests {
  use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc, Barrier, Mutex,
  };

  use napi::{Error, Status};

  use super::{
    canonical_socpak_path, datacore_record_path_key, parse_localization, read_socpak_with_loader,
    record_virtual_path_key, resolve_file_url, virtual_path_key, SocpakChildrenCache,
  };

  const SOCPAK_XML: &[u8] = br#"<ObjectContainer><ChildObjectContainers><Child name="root"><ChildObjectContainers><Child name="nested" /></ChildObjectContainers></Child></ChildObjectContainers></ObjectContainer>"#;

  fn stored_zip_entry(name: &str, payload: &[u8]) -> Vec<u8> {
    let mut data = Vec::new();
    data.extend_from_slice(&0x04034b50u32.to_le_bytes());
    data.extend_from_slice(&20u16.to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    data.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    data.extend_from_slice(&(name.len() as u16).to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(name.as_bytes());
    data.extend_from_slice(payload);
    data
  }

  fn socpak_fixture(package_name: &str) -> Vec<u8> {
    stored_zip_entry(&format!("{package_name}.xml"), SOCPAK_XML)
  }

  #[test]
  fn parses_localization_entries_case_insensitively() {
    let localization = parse_localization(
      b"\xef\xbb\xbf; comment\r\nStantonStar=Stanton\r\nFormula=value=with=equals\r\n",
    );

    assert_eq!(
      localization.get("stantonstar").map(String::as_str),
      Some("Stanton")
    );
    assert_eq!(
      localization.get("formula").map(String::as_str),
      Some("value=with=equals"),
    );
  }

  #[test]
  fn resolves_relative_file_urls_against_the_record_directory() {
    assert_eq!(
      resolve_file_url(
        "libs/foundry/records/level/pu/pu.json",
        "file://./../../equipment/ships/ship.json",
      ),
      Some("file:///libs/foundry/records/equipment/ships/ship.json".to_string()),
    );
  }

  #[test]
  fn normalizes_canonical_file_urls_for_record_lookup() {
    assert_eq!(
      datacore_record_path_key("/libs/foundry/records/level/pu/pu.json"),
      "libs/foundry/records/level/pu/pu",
    );
  }

  #[test]
  fn normalizes_json_urls_to_extensionless_record_paths() {
    assert_eq!(
      datacore_record_path_key("file:///libs/foundry/records/ssolarsystem/stanton.json"),
      "libs/foundry/records/ssolarsystem/stanton",
    );
  }

  #[test]
  fn normalizes_json_and_xml_record_paths_to_the_same_key() {
    assert_eq!(
      datacore_record_path_key("file:///libs/foundry/records/starmap/pu/stantonsolarsystem.json"),
      datacore_record_path_key("libs/foundry/records/starmap/pu/stantonsolarsystem.xml"),
    );
  }

  #[test]
  fn virtual_paths_and_record_names_share_an_index_key() {
    assert_eq!(
      record_virtual_path_key("SSolarSystem.Stanton"),
      virtual_path_key("file:///libs/foundry/records/ssolarsystem/stanton.json"),
    );
  }

  #[test]
  fn normalizes_only_existing_socpak_path_equivalences() {
    assert_eq!(
      canonical_socpak_path("DATA/ObjectContainers\\PU/Test.SocPak"),
      "data\\objectcontainers\\pu\\test.socpak",
    );
    assert_eq!(
      canonical_socpak_path("objectcontainers/pu/test.socpak"),
      "data\\objectcontainers\\pu\\test.socpak",
    );
    assert_ne!(
      canonical_socpak_path("objectcontainers/pu/./test.socpak"),
      canonical_socpak_path("objectcontainers/pu/test.socpak"),
    );
    assert_ne!(
      canonical_socpak_path("/objectcontainers/pu/test.socpak"),
      canonical_socpak_path("objectcontainers/pu/test.socpak"),
    );
  }

  #[test]
  fn caches_equivalent_socpak_paths_and_preserves_caller_paths() {
    let cache = Mutex::new(Default::default());
    let loads = AtomicUsize::new(0);
    let first_path = "Data/ObjectContainers/PU/Test.socpak";
    let second_path = "objectcontainers\\pu\\TEST.SOCPAK";
    let first = read_socpak_with_loader(first_path, &cache, |_| {
      loads.fetch_add(1, Ordering::SeqCst);
      Ok(socpak_fixture("test"))
    })
    .expect("first read should succeed");
    let second = read_socpak_with_loader(second_path, &cache, |_| {
      loads.fetch_add(1, Ordering::SeqCst);
      Ok(socpak_fixture("test"))
    })
    .expect("equivalent read should use the cache");

    assert_eq!(loads.load(Ordering::SeqCst), 1);
    assert_eq!(first["path"], first_path);
    assert_eq!(second["path"], second_path);
    assert_eq!(first["children"], second["children"]);
  }

  #[test]
  fn cached_socpak_reads_return_independent_json() {
    let cache = Mutex::new(Default::default());
    let mut first = read_socpak_with_loader("test.socpak", &cache, |_| Ok(socpak_fixture("test")))
      .expect("first read should succeed");
    first["children"][0]["name"] = serde_json::json!("changed");

    let second = read_socpak_with_loader("DATA\\TEST.SOCPAK", &cache, |_| {
      panic!("cached read must not invoke the loader")
    })
    .expect("cached read should succeed");

    assert_eq!(second["children"][0]["name"], "root");
  }

  #[test]
  fn distinct_socpak_paths_are_cached_separately() {
    let cache = Mutex::new(Default::default());
    let loads = AtomicUsize::new(0);
    for path in ["first.socpak", "second.socpak", "FIRST.SOCPAK"] {
      read_socpak_with_loader(path, &cache, |canonical_path| {
        loads.fetch_add(1, Ordering::SeqCst);
        let package_name = canonical_path
          .rsplit('\\')
          .next()
          .expect("canonical path has a filename")
          .strip_suffix(".socpak")
          .expect("fixture path ends in .socpak");
        Ok(socpak_fixture(package_name))
      })
      .expect("read should succeed");
    }

    assert_eq!(loads.load(Ordering::SeqCst), 2);
  }

  #[test]
  fn failed_socpak_loads_are_retried() {
    let cache = Mutex::new(Default::default());
    let loads = AtomicUsize::new(0);
    let first = read_socpak_with_loader("retry.socpak", &cache, |_| {
      loads.fetch_add(1, Ordering::SeqCst);
      Err(Error::new(Status::GenericFailure, "fixture failure"))
    });
    assert!(first.is_err());

    let second = read_socpak_with_loader("DATA/RETRY.SOCPAK", &cache, |_| {
      loads.fetch_add(1, Ordering::SeqCst);
      Ok(socpak_fixture("retry"))
    });

    assert!(second.is_ok());
    assert_eq!(loads.load(Ordering::SeqCst), 2);
  }

  #[test]
  fn equivalent_concurrent_socpak_reads_are_coordinated() {
    let cache: Arc<SocpakChildrenCache> = Arc::new(Mutex::new(Default::default()));
    let loads = Arc::new(AtomicUsize::new(0));
    let barrier = Arc::new(Barrier::new(3));
    let handles = [
      "Data/ObjectContainers/PU/Test.socpak",
      "objectcontainers\\pu\\TEST.SOCPAK",
    ]
    .into_iter()
    .map(|path| {
      let cache = Arc::clone(&cache);
      let loads = Arc::clone(&loads);
      let barrier = Arc::clone(&barrier);
      std::thread::spawn(move || {
        barrier.wait();
        read_socpak_with_loader(path, &cache, |_| {
          loads.fetch_add(1, Ordering::SeqCst);
          Ok(socpak_fixture("test"))
        })
        .expect("read should succeed")
      })
    })
    .collect::<Vec<_>>();
    barrier.wait();
    for handle in handles {
      handle.join().expect("reader thread should not panic");
    }

    assert_eq!(loads.load(Ordering::SeqCst), 1);
  }
}
