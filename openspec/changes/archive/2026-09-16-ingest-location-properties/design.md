## Context

See `proposal.md` for motivation and the capability deltas for required behavior. The existing
ingester constructs a complete location snapshot from DataCore records and selected SOCpak child
containers, then submits parent-first batches through a generation-based Convex protocol. Its
`shouldLoadSocpak` filter only follows PU paths containing `system`, `station`, or `jumppoint`.

Inspection of the current LIVE archive established these constraints:

- `StarMapObject.amenities` links 281 of 2,069 records to 25
  `StarMapAmenityTypeEntry` definitions, with at most 14 amenities on one object.
- External freight elevators are explicit child-container placements under
  `Data/ObjectContainers/PU/loc/mod/common/ext_cargo/`.
- Exhaustive PU traversal finds 18 locations with those modules. Levski is missed by the current
  filter because its root is `PU/loc/flagship/nyx/levski/levski_all.socpak`.
- Exhaustive traversal covers about 53,000 owner/package contexts but only about 4,900 unique
  packages, making parsed-package caching important.
- The archive currently contains at least one reachable ancillary package reference whose target
  is absent.
- Broad traversal discovers 11 additional resolvable starmap locations hidden behind paths excluded
  by the current filter.

The current `locationProperties` table is an unused string key/value EAV table. Existing cleanup
deletes its rows with stale locations, but import batches neither write nor return properties.

## Goals / Non-Goals

**Goals:**

- Keep native archive parsing in the Rust extractor and semantic location interpretation in the
  TypeScript ingester.
- Produce one validated snapshot containing locations, declared amenities, physical external-
  elevator facts, provenance, and per-location physical-scan completeness.
- Reconcile source-owned properties without replacing stable location IDs or unrelated properties.
- Preserve import idempotency and stay comfortably within Convex limits.
- Make exact property filtering possible without loading the complete location tree.

**Non-Goals:**

- Counting physical elevators or storing their composed transforms.
- Parsing every entity inside SOC files.
- Deriving shop inventory, transit connectivity, or service availability beyond declared starmap
  amenities.
- Adding location-property UI.
- Treating a filename fragment outside the explicit external-cargo module family as evidence.

## Decisions

### Model properties as normalized multivalued facts

Each ingested property will have:

```text
locationId
key                 "amenity"
value               normalized semantic identifier
source              "starmap_amenity" | "object_container"
sourceReference     amenity GUID or canonical SOCpak path
sourceName?         raw CIG amenity name
displayName?        resolved amenity display name
icon?               CIG icon path
```

The shared types package will define the source enum and normalized amenity values. Declared
amenities will be normalized through an explicit mapping from the raw CIG amenity name, following
the existing location-type pattern. An unknown value fails extraction, while source GUID and raw
metadata remain available for diagnostics. `external_freight_elevator` is a VerseTools-derived
amenity value with object-container provenance; it is distinct from CIG's generic
`cargo_freight_elevator` declaration.

The database uniqueness invariant is `(locationId, key, value, source)`. A source can update its
reference or display metadata without creating another semantic fact. Using one boolean column per
amenity was rejected because CIG can add amenity definitions and consumers need a uniform filter.
Storing raw JSON in `value` was rejected because it prevents efficient exact matching and stable
product semantics.

### Extend the existing property table additively

The current `locationProperties` table will remain the storage boundary. Provenance and display
fields will initially be optional at the database layer so already persisted or manually created
key/value rows remain valid. Shared ingestion schemas will require provenance on all new source-
owned rows. Reconciliation will only modify rows whose `source` identifies the game-data ingester.

Indexes will support `(locationId, source)`, `(locationId, key, value, source)`, and `(key, value)`.
This was preferred to a separate amenity link table because the requested capability includes
future non-amenity location facts and an EAV table already exists. A catalog table for amenity types
was rejected for this phase because each declared property must retain build-specific display
metadata and there are only 25 definitions.

### Cache parsing, not placement traversal

The Rust extractor will cache parsed `readSocpak` child-container results by normalized canonical
P4K path. The immutable package result can be reused, but the ingester must still traverse it for
each owning-location and placement context. This avoids thousands of repeated archive reads without
collapsing repeated placements or losing ownership.

The ingester will replace category-based loading with traversal of every reachable PU `.socpak`.
Cycle detection remains context-sensitive, while package parsing is path-cached. The nearest
successfully resolved `starMapRecord` determines property ownership. Broad traversal also becomes
the canonical location traversal, so the additional reachable starmap records are ingested rather
than being inspected through a parallel shadow graph.

Keeping the old location traversal and adding an amenity-only traversal was rejected because two
graphs could disagree about ownership, error handling, and reachability.

### Detect the external-cargo family rather than variants

A placement is external freight-elevator evidence when its normalized canonical path is within the
station external-cargo module family under `PU/loc/mod/common/ext_cargo/`. Numbered assemblies and
their base variants are not individually enumerated. Multiple matching placements collapse to one
semantic property per location and source; placement counts are not persisted.

The source reference records the matching canonical module path. If multiple variants occur at one
location, reconciliation selects a deterministic sorted reference for the aggregate fact and logs
the observed variants. An evidence table was rejected because no current requirement consumes
individual placements or transforms.

### Track completeness independently for each property source

DataCore amenity extraction is authoritative: unresolved records or unknown normalized names abort
the snapshot before Convex is called.

Physical inspection is best effort only for ancillary structural references. A missing package
whose referencing child has a `starMapRecord`, or a missing root package, aborts extraction because
location reachability itself is uncertain. A missing structural child without a starmap identity is
logged and marks object-container property inspection incomplete for the current owner. Independent
branches continue.

Each location input carries whether its object-container property source was completely inspected.
Convex always reconciles declared starmap properties. It replaces object-container properties only
when that source is complete; otherwise it preserves existing object-container rows while still
adding facts positively observed in the partial scan. This prevents a malformed archive reference
from turning unknown into false absence.

### Reconcile properties in the existing generation batches

Properties travel with their owning location in `IngestLocationSchema`, participate in snapshot and
batch hashes, and are reconciled in the same mutation that creates or updates the location. The
mutation loads existing source-owned properties for that location, computes a semantic diff, and
applies only required inserts, patches, and deletes.

The current location batch size must be revalidated against worst-case property writes rather than
assumed unchanged. Current source data has at most 14 declared amenities per location, but tests and
snapshot measurements will enforce payload and operation headroom. Existing generation batch
records preserve retry idempotency: a committed matching batch returns before repeating either
location or property work.

Reconciling all properties during finalization was rejected because it would require a second large
global snapshot or unbounded cleanup scan. Deleting and reinserting every property was rejected
because it creates avoidable writes and churns document IDs.

### Add focused property reads

One query lists properties for a bounded set of location IDs. Another uses the `(key, value)` index
to return matching locations and properties with pagination. Both check the existing active rebuild
state before reading. Properties will not be attached to the complete location-tree response,
avoiding unbounded response growth and per-location lookup fan-out.

## Risks / Trade-offs

- [Broad traversal increases extraction time and exposes stale archive references] -> Cache parsed
  packages, aggregate diagnostics, distinguish fatal location-bearing references from incomplete
  ancillary branches, and measure the LIVE traversal in validation.
- [Explicit amenity normalization can block ingestion after CIG adds a type] -> Fail before any
  reconciliation and log the unknown GUID and raw name so the mapping can be deliberately extended.
- [Optional provenance permits legacy rows outside the source uniqueness invariant] -> Apply
  uniqueness only to source-owned rows and preserve legacy/manual rows unchanged.
- [Path-based physical classification can break if CIG reorganizes assets] -> Match the explicit
  module family, retain canonical path provenance, and add fixture coverage for new numbered
  variants and unrelated cargo paths.
- [Partial physical scans can preserve stale positive facts] -> Prefer stale positives over false
  negatives, surface incomplete-source diagnostics, and replace them on the next complete import.
- [Location count changes when traversal broadens] -> Treat newly reachable records as intended
  source corrections and cover representative nested hospital and hangar records in tests.

## Migration Plan

1. Deploy additive property schema fields and indexes while preserving existing key/value rows.
2. Deploy property commands, routes, shared schemas, and generated Convex API updates.
3. Deploy extractor caching and the ingester's broad traversal/property snapshot changes.
4. Run a controlled import, review traversal anomalies and property totals, and verify the known 18
   external freight-elevator locations, including Levski.
5. Roll back application code if needed; additive optional fields and indexes can remain, and prior
   non-source properties are unaffected. A later successful import can replace source-owned rows.
