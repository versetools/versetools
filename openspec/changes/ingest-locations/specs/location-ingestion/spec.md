## Purpose

Provide a reliable, authoritative Star Citizen location tree by extracting game data and reconciling it into the VerseTools location database.

## ADDED Requirements

### Requirement: Extract the reachable location tree
The ingestion system SHALL start at the configured MegaMap universe record, resolve each solar system, and recursively traverse its relevant object-container hierarchy. It SHALL create candidate locations from resolvable `StarMapObject` records and SHALL retain every reachable candidate without player-visibility filtering.

#### Scenario: Traverse a solar system hierarchy
- **WHEN** the universe record references a solar system and its root object container
- **THEN** the system ingests the system location and every reachable child location with a resolvable starmap record

#### Scenario: Preserve non-player-facing candidates
- **WHEN** a reachable starmap location has source visibility or gameplay flags that would hide it from players
- **THEN** the system includes the location in the candidate tree

### Requirement: Normalize and retain location type provenance
The ingestion system SHALL assign each location a normalized VerseTools type and SHALL retain the raw DataCore type name and type CIG GUID. It SHALL normalize `Asteroid_ValidQT` to `asteroid` and `Manmade_VisibleOnInteraction` to `manmade`; it SHALL map the remaining supported source types as follows: `SolarSystem` to `system`, `Star` to `star`, `Planet` to `planet`, `Moon` to `moon`, `Asteroid` to `asteroid`, `Outpost` to `outpost`, `LandingZone` to `landing_zone`, `NavPoint` to `nav_point`, `PointOfInterest` to `point_of_interest`, and `Manmade` to `manmade`.

#### Scenario: Normalize an implementation-specific source type
- **WHEN** a location has the raw source type `Manmade_VisibleOnInteraction`
- **THEN** the system stores `manmade` as its normalized type and retains `Manmade_VisibleOnInteraction` with its type CIG GUID as provenance

#### Scenario: Encounter an unknown source type
- **WHEN** a candidate location has a raw source type outside the supported mappings
- **THEN** the ingestion run fails without reconciling or deleting any stored locations

### Requirement: Validate source anomalies before reconciliation
The ingestion system SHALL fail the run if a traversed object-container location has no `starMapRecord`. It SHALL retain the first occurrence of each location CIG GUID, log subsequent occurrences as duplicates, and continue the run. It SHALL log and skip a location whose declared parent CIG GUID cannot be ingested, including descendants that consequently cannot be attached.

#### Scenario: Missing starmap record
- **WHEN** a traversed object-container location lacks a `starMapRecord`
- **THEN** the system fails the run and leaves the previously stored location tree unchanged

#### Scenario: Duplicate location placement
- **WHEN** traversal encounters the same location CIG GUID through multiple placements
- **THEN** the system retains the first candidate, logs each later placement, and continues the run

#### Scenario: Missing parent location
- **WHEN** a candidate declares a parent CIG GUID that is not available for ingestion
- **THEN** the system logs the anomaly and skips that candidate and any descendant that cannot be attached

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
The ingestion system SHALL partition reconciliation into bounded requests that remain within the documented Convex function argument, execution, database I/O, document-write, index-range, and concurrent I/O limits. It SHALL associate all requests for a snapshot with one import generation and SHALL finalize that generation only after every required batch succeeds. It SHALL aggregate anomaly reporting so no reconciliation request depends on logs beyond Convex log limits.

#### Scenario: Process a snapshot exceeding one function's limits
- **WHEN** a valid source snapshot cannot be reconciled by one Convex function within documented limits
- **THEN** the system processes bounded parent-first batches associated with the same import generation

#### Scenario: Fail a batch before finalization
- **WHEN** a reconciliation batch fails
- **THEN** the system does not finalize the import generation or remove locations as stale

### Requirement: Remove only confirmed stale locations
After a successfully finalized import generation, the system SHALL remove locations that were absent from the traversed source snapshot. It SHALL preserve any previously stored location that was encountered but skipped because it or an ancestor could not be attached. Removing a location SHALL remove its closure relations and associated location properties.

#### Scenario: Remove a location absent from game data
- **WHEN** a stored location CIG GUID is absent from a successful source traversal
- **THEN** the system removes that location and its descendants with all associated closure and property records

#### Scenario: Preserve an invalid encountered location
- **WHEN** a stored location is encountered during traversal but skipped because its parent cannot be ingested
- **THEN** the system preserves the stored location rather than classifying it as stale
