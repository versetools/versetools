## Purpose

Provide queryable, multivalued facts about Star Citizen locations while retaining enough source
provenance to reconcile game-derived data safely and diagnose how each fact was established.

## ADDED Requirements

### Requirement: Represent normalized multivalued location properties

The location database SHALL represent each property as a location, normalized key, normalized
value, source kind, and source reference. A location MAY have multiple values for the same key, but
SHALL have at most one property for a given location, key, value, and source kind. Amenity properties
SHALL use the key `amenity`.

#### Scenario: Store several amenities for one location

- **WHEN** a location declares a clinic, docking, and vehicle-services amenities
- **THEN** the database stores three distinct `amenity` properties for that location

#### Scenario: Store declared and derived amenities together

- **WHEN** a location declares a cargo freight elevator and contains a physical external freight
  elevator
- **THEN** the database stores both normalized amenity values with their distinct source kinds and
  references

### Requirement: Retain amenity display provenance

For properties sourced from a starmap amenity record, the database SHALL retain the amenity CIG
GUID, raw name, resolved display name, and icon path supplied by the ingested snapshot. Property
consumers SHALL receive this metadata without resolving DataCore records at query time.

#### Scenario: Read a declared amenity

- **WHEN** a consumer lists properties for a location with a declared clinic amenity
- **THEN** the clinic property includes its normalized value and ingested CIG name, display name,
  icon, and GUID

### Requirement: Reconcile game-derived properties with location imports

The location import SHALL create missing game-derived properties, update changed provenance, and
remove source properties absent from a complete current snapshot. Reconciliation SHALL preserve
properties not owned by game-data ingestion and SHALL preserve object-container-derived properties
for locations whose physical inspection was incomplete. Property reconciliation SHALL be
idempotent when an import batch is retried.

#### Scenario: Remove a stale declared amenity

- **WHEN** a complete new snapshot no longer declares an amenity previously ingested for a location
- **THEN** final reconciliation removes that game-derived property

#### Scenario: Preserve an unrelated property

- **WHEN** a location import reconciles a location that also has a property not owned by the game-
  data ingester
- **THEN** the unrelated property remains unchanged

#### Scenario: Retry a property batch

- **WHEN** an already committed import batch is submitted again with the same batch hash
- **THEN** no duplicate properties are created and the retry succeeds idempotently

### Requirement: Reconcile properties within Convex limits

Property payloads and database work SHALL remain within the documented Convex argument, execution,
I/O, index-range, concurrency, and write limits. Batch sizing SHALL account for the maximum number
of properties on a location in addition to location and import-tracking writes.

#### Scenario: Import locations with many amenities

- **WHEN** a snapshot contains locations with the maximum supported amenity set
- **THEN** the ingester partitions requests so every reconciliation mutation remains within Convex
  limits

### Requirement: Query location properties

Consumers SHALL be able to list properties for specified locations and find locations having an
exact normalized property key and value. Property reads SHALL reject while the associated location
import is rebuilding, consistent with location-tree reads.

#### Scenario: List a location's amenities

- **WHEN** a consumer requests properties for an existing location
- **THEN** the system returns all properties for that location with provenance metadata

#### Scenario: Find external freight-elevator locations

- **WHEN** a consumer searches for key `amenity` and value `external_freight_elevator`
- **THEN** the system returns every matching location and its matching property

#### Scenario: Read during an active location import

- **WHEN** a consumer requests location properties while the location tree is rebuilding
- **THEN** the system returns the explicit rebuild-in-progress error
