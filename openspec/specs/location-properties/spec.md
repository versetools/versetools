# Location Properties Specification

## Purpose

Provide queryable, multivalued facts about Star Citizen locations while retaining enough source
provenance to reconcile game-derived data safely and diagnose how each fact was established.

## Requirements

### Requirement: Represent normalized multivalued location properties

The location database SHALL represent each property as a location, constrained property type,
normalized value, localized name, source kind, and source reference. A location MAY have multiple
values for the same property type, but SHALL have at most one semantic property for a given location,
type, and value. Amenity properties SHALL use the `amenity` property type and a supported normalized
amenity value.

#### Scenario: Store several amenities for one location

- **WHEN** a location declares a clinic, docking, and vehicle-services amenities
- **THEN** the database stores three distinct properties with type `amenity` and their respective
  normalized values

#### Scenario: Store declared and derived amenities together

- **WHEN** a location declares a cargo freight elevator and contains a physical external freight
  elevator
- **THEN** the database stores both normalized amenity values with their distinct source kinds and
  references

### Requirement: Retain amenity display provenance

For properties sourced from a starmap amenity record, the database SHALL retain the resolved name,
optional source translation key, icon path, amenity CIG GUID, and source kind supplied by the
ingested snapshot. It SHALL NOT persist the raw CIG amenity name after normalization. Public property
consumers SHALL receive the property type, localized name, and normalized value without resolving
DataCore records at query time.

#### Scenario: Read a declared amenity

- **WHEN** a consumer reads a location with a declared clinic amenity
- **THEN** the public clinic property contains type `amenity`, its localized name, and value `clinic`

#### Scenario: Retain a property translation key internally

- **WHEN** an ingested amenity name was resolved from a source translation key
- **THEN** the persisted property retains that key for provenance without exposing it in the public
  property response

### Requirement: Reconcile game-derived properties with location imports

The location import SHALL create missing game-derived properties, update changed names and
provenance, and remove source properties absent from a complete current snapshot. Reconciliation
SHALL compare semantic properties by location, type, and value while retaining source ownership for
source-specific updates and deletion. It SHALL preserve properties not owned by game-data ingestion
and SHALL preserve object-container-derived properties for locations whose physical inspection was
incomplete. Property reconciliation SHALL be idempotent when an import batch is retried.

#### Scenario: Remove a stale declared amenity

- **WHEN** a complete new snapshot no longer declares an amenity previously ingested for a location
- **THEN** final reconciliation removes that game-derived property

#### Scenario: Preserve an unrelated property

- **WHEN** a location import reconciles a location that also has a property not owned by the game-
  data ingester
- **THEN** the unrelated property remains unchanged

#### Scenario: Update localized property metadata

- **WHEN** a semantic property remains present but its localized name, translation key, icon, or
  source reference changes
- **THEN** reconciliation updates the existing property without creating a duplicate semantic fact

#### Scenario: Retry a property batch

- **WHEN** an already committed import batch is submitted again with the same batch hash
- **THEN** no duplicate properties are created and the retry succeeds idempotently

### Requirement: Reconcile properties within Convex limits

Property import payloads, reconciliation work, and complete-tree property reads SHALL remain within
the documented Convex argument, execution, database I/O, document-read, index-range, concurrency,
write, and response-size limits. Batch sizing SHALL account for the maximum number of properties on
a location, and complete-tree reads SHALL enforce a measured property budget before returning a
response.

#### Scenario: Import locations with many amenities

- **WHEN** a snapshot contains locations with the maximum supported amenity set
- **THEN** the ingester partitions requests so every reconciliation mutation remains within Convex
  limits

#### Scenario: Exceed the complete-tree property budget

- **WHEN** a complete location-tree request would read more properties than the supported response
  budget
- **THEN** the system rejects the request with an explicit limit error rather than performing an
  unbounded read or returning a partial tree

### Requirement: Query location properties

Consumers SHALL receive every location's public properties as part of the complete location-tree
response and SHALL be able to find locations having an exact normalized property type and value.
The standalone location-property listing operation SHALL no longer be exposed. Exact property
search results SHALL contain transformed public locations rather than raw location or property
documents. Property reads SHALL reject while the associated location import is rebuilding,
consistent with location-tree reads.

#### Scenario: List a location's amenities

- **WHEN** a consumer requests the complete location tree
- **THEN** each returned location contains all of its public properties without requiring a second
  property request

#### Scenario: Find external freight-elevator locations

- **WHEN** a consumer searches for type `amenity` and value `external_freight_elevator`
- **THEN** the system returns a page of transformed matching locations whose public properties
  include the matching amenity

#### Scenario: Read during an active location import

- **WHEN** a consumer requests the location tree or searches by property while the location tree is
  rebuilding
- **THEN** the system returns the explicit rebuild-in-progress error

### Requirement: Return a type-safe public location shape

Location reads SHALL return a recursive public representation containing the branded Convex `_id`,
localized name, nullable description, normalized location type, grouped transform, public
properties, and optional children. The grouped transform SHALL contain world space, surface state, a
three-number position tuple, and nullable quaternion rotation. Each public property SHALL contain
only its constrained type, localized name, and normalized value. Persistence metadata, parent IDs,
CIG identifiers, source provenance, translation keys, and creation timestamps SHALL NOT appear in
the public representation.

#### Scenario: Transform a location with properties

- **WHEN** a location with transform data and multiple amenities is returned to a client
- **THEN** the client receives `_id`, public text and type fields, grouped transform data, and an
  array of properties shaped as type, name, and value

#### Scenario: Transform nullable location fields

- **WHEN** a location has no description or rotation
- **THEN** its public description and transform rotation remain null rather than receiving invented
  defaults

#### Scenario: Transform a leaf location

- **WHEN** a returned location has no children
- **THEN** the public representation may omit `children` while still including an empty properties
  array when it has no properties

#### Scenario: Infer the response contract

- **WHEN** a typed client consumes a location query
- **THEN** it can infer the complete recursive public location and property shape from the query
  result without importing backend command or database-document types
