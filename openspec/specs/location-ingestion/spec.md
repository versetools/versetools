# Location Ingestion Specification

## Purpose

Provide a reliable, authoritative Star Citizen location tree by extracting game data and reconciling it into the VerseTools location database.

## Requirements

### Requirement: Extract the reachable location tree

The ingestion system SHALL start at the configured MegaMap universe record, resolve each solar
system, and recursively traverse every reachable PU object-container package rather than selecting
packages by path category. It SHALL create candidate locations from resolvable `StarMapObject`
records and SHALL retain every reachable candidate without player-visibility filtering. Reusable
package contents MAY be cached, but traversal SHALL preserve each placement's owning location and
transform context.

#### Scenario: Traverse a solar system hierarchy

- **WHEN** the universe record references a solar system and its root object container
- **THEN** the system ingests the system location and every reachable child location with a resolvable starmap record

#### Scenario: Traverse a location package outside legacy path categories

- **WHEN** a reachable location-bearing container references a PU package whose path does not
  contain `system`, `station`, or `jumppoint`
- **THEN** the system traverses that package and includes its resolvable nested locations and
  location facts

#### Scenario: Preserve non-player-facing candidates

- **WHEN** a reachable starmap location has source visibility or gameplay flags that would hide it from players
- **THEN** the system includes the location in the candidate tree

### Requirement: Extract declared location amenities

The ingestion system SHALL resolve every amenity referenced by an ingested `StarMapObject`, map it
to the supported normalized location-property vocabulary, and retain the amenity record's CIG GUID,
localized name, optional source translation key, and icon as source provenance. It SHALL use a
readable normalized amenity name when a source translation key cannot be resolved and SHALL NOT
persist the raw CIG amenity name after normalization. Encountering an amenity that cannot be resolved
or normalized SHALL fail snapshot extraction before reconciliation begins.

#### Scenario: Extract a declared freight-elevator amenity

- **WHEN** an ingested starmap object references the `Commodity Trading - Freight Elevator`
  amenity record with a resolvable display-name translation key
- **THEN** its snapshot contains the normalized cargo freight-elevator property, localized name,
  source translation key, amenity GUID, and icon

#### Scenario: Fall back from an unresolved amenity translation

- **WHEN** a supported amenity has a display-name translation key that cannot be resolved
- **THEN** its snapshot retains the translation key and uses a readable normalized amenity name
  rather than exposing the raw translation key as its name

#### Scenario: Encounter an unknown amenity type

- **WHEN** an ingested starmap object references an amenity outside the supported normalization
  mapping
- **THEN** extraction fails without reconciling locations or properties

### Requirement: Preserve localized location text provenance

The ingestion system SHALL resolve source localization identifiers for location names and
descriptions before reconciliation and SHALL retain both each resolved value and its optional source
translation key. Literal source text SHALL remain unchanged without an invented translation key,
and an absent description SHALL remain null.

#### Scenario: Extract localized location text

- **WHEN** a location name and description are source localization identifiers with available
  translations
- **THEN** the snapshot contains the localized name and description together with their original
  translation keys

#### Scenario: Extract literal location text

- **WHEN** a location name or description is literal source text rather than a localization
  identifier
- **THEN** the snapshot retains that text without assigning a translation key

#### Scenario: Extract an absent description

- **WHEN** a location has no source description
- **THEN** the snapshot retains a null description and no description translation key

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

### Requirement: Normalize and retain location type provenance

The ingestion system SHALL assign each location a normalized VerseTools type and SHALL retain the raw DataCore type name and type CIG GUID. It SHALL normalize implementation variants such as `Asteroid_ValidQT`, `Outpost_InvalidQT`, `Manmade_VisibleOnInteraction`, `ManmadeJumpPoint`, `S42_Moon`, and `S42_Planet` to their semantic types. It SHALL support the current game categories `system`, `star`, `planet`, `moon`, `asteroid`, `anomaly`, `cardinal_point`, `jump_point`, `outpost`, `landing_zone`, `nav_point`, `point_of_interest`, `manmade`, `quantum_trace_point`, and `you_are_here`.

#### Scenario: Normalize an implementation-specific source type

- **WHEN** a location has the raw source type `Manmade_VisibleOnInteraction`
- **THEN** the system stores `manmade` as its normalized type and retains `Manmade_VisibleOnInteraction` with its type CIG GUID as provenance

#### Scenario: Encounter an unknown source type

- **WHEN** a candidate location has a raw source type outside the supported mappings
- **THEN** the ingestion run fails without reconciling or deleting any stored locations

### Requirement: Validate source anomalies before reconciliation

The ingestion system SHALL distinguish structural object-container instances from location-bearing instances. It SHALL recurse through structural instances without a `starMapRecord` using the nearest enclosing location as parent. When a declared `starMapRecord` cannot be resolved, it SHALL log and skip that placement while continuing traversal under the nearest enclosing valid location. It SHALL retain the first occurrence of each location CIG GUID, log subsequent occurrences as duplicates, and continue the run. It SHALL log and classify as invalid a location whose declared parent CIG GUID cannot be ingested, including descendants that consequently cannot be attached.

#### Scenario: Structural container without a starmap record

- **WHEN** a traversed object-container location lacks a `starMapRecord`
- **THEN** the system recurses through that structural container while retaining the nearest enclosing location as parent

#### Scenario: Unresolvable declared starmap record

- **WHEN** an object-container instance declares a `starMapRecord` that cannot be resolved
- **THEN** the system logs and skips that placement, continues traversal under the nearest enclosing valid location, and preserves the unresolved GUID for stale cleanup classification

#### Scenario: Duplicate location placement

- **WHEN** traversal encounters the same location CIG GUID through multiple placements
- **THEN** the system retains the first candidate, logs each later placement, and continues the run

#### Scenario: Missing parent location

- **WHEN** a candidate declares a parent CIG GUID that is not available for ingestion
- **THEN** the system logs the anomaly and removes that candidate and any descendant that cannot be attached from the stored tree

### Requirement: Reconcile locations using CIG GUIDs

The location database SHALL treat the location CIG GUID as the canonical source identity for ingestion. Given a successfully extracted source snapshot, the system SHALL create missing locations, update changed location data, and move locations whose canonical parent changes. It SHALL establish parent locations before their children and SHALL keep Convex document IDs internal to the database boundary. The ingester SHALL invoke reconciliation through the secret-authenticated HTTP client provided by `@versetools/convex-client`.

#### Scenario: Update an existing location

- **WHEN** a successfully validated candidate has the same CIG GUID as a stored location and different source data or parent
- **THEN** the system updates the stored location and its tree placement without changing its canonical identity

#### Scenario: Create a child location

- **WHEN** a candidate parent and child are absent from the database
- **THEN** the system creates the parent before creating the child and stores the child beneath that parent

#### Scenario: Authenticate an ingestion request

- **WHEN** the ingester submits a validated location snapshot to Convex
- **THEN** it uses the `@versetools/convex-client` HTTP client with the configured secret authentication

### Requirement: Reconcile within Convex function limits

The ingestion system SHALL partition reconciliation into bounded requests that remain within the documented Convex function argument, execution, database I/O, document-write, index-range, and concurrent I/O limits. It SHALL associate all requests for a snapshot with one import generation and SHALL finalize that generation only after every required batch succeeds. It SHALL rebuild location closure records separately in bounded work after applying location documents and parent relationships. It SHALL aggregate anomaly reporting so no reconciliation request depends on logs beyond Convex log limits.

#### Scenario: Process a snapshot exceeding one function's limits

- **WHEN** a valid source snapshot cannot be reconciled by one Convex function within documented limits
- **THEN** the system processes bounded parent-first batches associated with the same import generation

#### Scenario: Fail a batch before finalization

- **WHEN** a reconciliation batch fails
- **THEN** the system does not finalize the import generation or remove locations as stale

#### Scenario: Abort a failed import before cleanup

- **WHEN** an import has not successfully reconciled any batch and cannot complete
- **THEN** an authenticated caller can abort the generation, remove its tracking state, preserve the prior location tree, and restore location tree reads

#### Scenario: Resume an import after a reconciled batch fails

- **WHEN** an import fails after one or more reconciliation batches have succeeded
- **THEN** the system retains the active generation and rejects tree reads until the ingester resumes and completes that generation

#### Scenario: Rebuild closure records in bounded work

- **WHEN** an import changes location parent relationships
- **THEN** the system rebuilds affected closure records in bounded requests before finalizing the import

### Requirement: Prevent reads during location tree rebuilds

The location database SHALL reject location tree reads while an import or oversized location move is rebuilding closure records. It SHALL resume tree reads only after the rebuild completes successfully.

#### Scenario: Read during an active rebuild

- **WHEN** a caller requests the location tree while closure rebuild work is active
- **THEN** the system returns an explicit rebuild-in-progress error

#### Scenario: Read after rebuild completion

- **WHEN** closure rebuild work has completed successfully
- **THEN** the system returns the location tree using the rebuilt closure records

### Requirement: Bound oversized manual location moves

The location database SHALL detect when a manual location move would exceed bounded closure-table work and SHALL perform that move through the bounded closure rebuild workflow rather than a single unbounded mutation.

#### Scenario: Move a large location subtree

- **WHEN** a manual move affects a subtree whose closure updates exceed the configured safe batch threshold
- **THEN** the system applies the parent relationship and completes closure updates through bounded rebuild work

### Requirement: Remove only confirmed stale locations

After a successfully finalized import generation, the system SHALL remove locations that were absent from the traversed source snapshot or classified as invalid because they or an ancestor could not be attached. Removing a location SHALL remove its closure relations and associated location properties.

#### Scenario: Remove a location absent from game data

- **WHEN** a stored location CIG GUID is absent from a successful source traversal
- **THEN** the system removes that location and its descendants with all associated closure and property records

#### Scenario: Remove an invalid encountered location

- **WHEN** a stored location is encountered during traversal but is invalid because its parent cannot be ingested
- **THEN** the system removes the location rather than preserving an unattached branch
