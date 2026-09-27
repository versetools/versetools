## MODIFIED Requirements

### Requirement: Extract the reachable location tree

The ingestion system SHALL start at the configured MegaMap universe record, resolve each solar
system, and recursively traverse every reachable PU object-container package rather than selecting
packages by path category. It SHALL create candidate locations from resolvable `StarMapObject`
records and SHALL retain every reachable candidate without player-visibility filtering. Reusable
package contents MAY be cached, but traversal SHALL preserve each placement's owning location and
transform context.

#### Scenario: Traverse a solar system hierarchy

- **WHEN** the universe record references a solar system and its root object container
- **THEN** the system ingests the system location and every reachable child location with a
  resolvable starmap record

#### Scenario: Traverse a location package outside legacy path categories

- **WHEN** a reachable location-bearing container references a PU package whose path does not
  contain `system`, `station`, or `jumppoint`
- **THEN** the system traverses that package and includes its resolvable nested locations and
  location facts

#### Scenario: Preserve non-player-facing candidates

- **WHEN** a reachable starmap location has source visibility or gameplay flags that would hide it
  from players
- **THEN** the system includes the location in the candidate tree

## ADDED Requirements

### Requirement: Extract declared location amenities

The ingestion system SHALL resolve every amenity referenced by an ingested `StarMapObject`, map it
to the supported normalized location-property vocabulary, and retain the amenity record's CIG GUID,
raw name, localized display name, and icon as source provenance. Encountering an amenity that cannot
be resolved or normalized SHALL fail snapshot extraction before reconciliation begins.

#### Scenario: Extract a declared freight-elevator amenity

- **WHEN** an ingested starmap object references the `Commodity Trading - Freight Elevator`
  amenity record
- **THEN** its snapshot contains the normalized cargo freight-elevator property and the source
  amenity metadata

#### Scenario: Encounter an unknown amenity type

- **WHEN** an ingested starmap object references an amenity outside the supported normalization
  mapping
- **THEN** extraction fails without reconciling locations or properties

### Requirement: Extract explicit physical location amenities

The ingestion system SHALL derive an external freight-elevator property when a reachable object-
container placement references the station external-cargo module family. Classification SHALL use
the module family and SHALL NOT depend on a fixed list of numbered module variants. The system SHALL
associate the property with the nearest enclosing resolvable starmap location and retain the source
container path as provenance.

#### Scenario: Find an external elevator in a flagship location package

- **WHEN** a location package such as Levski's references an external-cargo elevator module
- **THEN** the enclosing location receives the external freight-elevator property

#### Scenario: Encounter a new external-cargo module variant

- **WHEN** a reachable external-cargo elevator module uses a filename variant not previously seen
- **THEN** the system recognizes it from the module family without requiring a new filename
  allowlist entry

#### Scenario: Distinguish declared and physical cargo amenities

- **WHEN** a location declares a generic freight-elevator amenity but has no reachable external-
  cargo placement
- **THEN** the system does not infer that the location has an external freight elevator

### Requirement: Preserve facts when physical inspection is incomplete

The ingestion system SHALL log unresolved structural package references and continue traversing
independent branches. It SHALL mark physical property inspection incomplete for the affected owning
location and SHALL NOT use that incomplete scan to remove previously reconciled object-container-
derived properties. Unresolved root solar-system packages and location-bearing package references
SHALL remain hard extraction failures.

#### Scenario: Encounter a missing ancillary structural package

- **WHEN** a reachable structural child without its own starmap identity references a package that
  is absent from the archive
- **THEN** the system logs the reference, continues independent traversal, and preserves prior
  physical properties for the affected location

#### Scenario: Encounter a missing location-bearing package

- **WHEN** a child with a declared starmap identity references a package that is absent from the
  archive
- **THEN** extraction fails before reconciliation begins
