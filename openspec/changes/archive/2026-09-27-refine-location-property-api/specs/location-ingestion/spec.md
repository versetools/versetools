## MODIFIED Requirements

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

## ADDED Requirements

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
