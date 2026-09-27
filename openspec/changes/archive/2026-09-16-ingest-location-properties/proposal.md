## Why

VerseTools currently ingests location identity, hierarchy, and transforms but discards CIG's
declared amenities and cannot distinguish stations with physically placed external freight
elevators. The game data now exposes both amenity records and explicit external-cargo SOC modules,
so these facts can be extracted and reconciled instead of maintained manually.

## What Changes

- Add normalized, provenance-aware properties to location ingestion snapshots and reconcile them
  with their owning locations.
- Extract every declared `StarMapObject.amenities` reference and retain its CIG amenity identity.
- Traverse all reachable PU location containers, with package parsing cached by normalized path, so
  physical modules outside the current system/station/jump-point path filter are inspected.
- Classify placement of the `ext_cargo` station module family as an external freight-elevator
  property without enumerating individual module variants.
- Log and safely handle unresolved structural package references without treating an incomplete
  physical scan as authoritative absence.
- Add property lookup operations that can list a location's properties and find locations by a
  property key and value.
- Keep physical facility counts, general SOC entity extraction, shop inventories, transit routes,
  and frontend presentation out of scope.

## Capabilities

### New Capabilities

- `location-properties`: Persist, reconcile, and query multivalued location facts with source
  provenance.

### Modified Capabilities

- `location-ingestion`: Extend reachable-container traversal and source snapshots to include
  declared amenities and explicit external freight-elevator placement.

## Impact

- `apps/sc-data-extractor`: SOCpak child-container parsing gains transparent normalized-path caching
  for broad traversal; no product-level amenity classification moves into Rust.
- `apps/sc-data-ingester`: location extraction, traversal, anomaly reporting, snapshots, hashing,
  batching, and measurements gain property support.
- `packages/types`: shared property, provenance, and ingestion schemas are added or extended.
- `apps/convex`: location property schema, bounded reconciliation commands, cleanup behavior, and
  read routes are extended.
- Location imports may discover a small number of additional starmap locations currently hidden
  behind PU container paths excluded by the narrow traversal filter.
