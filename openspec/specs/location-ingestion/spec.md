# Location Ingestion Specification

## Purpose

Provide a reliable, authoritative Star Citizen location tree by extracting game data and reconciling it into the VerseTools location database.

## Requirements

### Requirement: Extract the reachable location tree

The ingestion system SHALL start at the configured MegaMap universe record, resolve each solar system, and recursively traverse its relevant object-container hierarchy. It SHALL create candidate locations from resolvable `StarMapObject` records and SHALL retain every reachable candidate without player-visibility filtering.

#### Scenario: Traverse a solar system hierarchy

- **WHEN** the universe record references a solar system and its root object container
- **THEN** the system ingests the system location and every reachable child location with a resolvable starmap record

#### Scenario: Preserve non-player-facing candidates

- **WHEN** a reachable starmap location has source visibility or gameplay flags that would hide it from players
- **THEN** the system includes the location in the candidate tree

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
