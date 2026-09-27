## Why

Location properties are currently exposed as raw persistence documents whose generic `key` field,
source-facing display metadata, and separate read endpoint do not express the intended typed public
API. Location and property localization also discards source translation keys, preventing future
re-localization and making unresolved labels surface as raw `@` identifiers.

## What Changes

- **BREAKING** Rename the persisted and query-facing location-property `key` field to a constrained
  `type`, initially supporting the `amenity` property type, and define semantic uniqueness by
  location, type, and value.
- **BREAKING** Replace persisted property `displayName` with localized `name`, retain its optional
  translation key, and remove persisted `sourceName` while keeping reconciliation provenance.
- Preserve localized location names and descriptions together with their optional source translation
  keys during extraction and import.
- Add a type-safe transformer that returns locations with `_id`, localized public fields, a grouped
  transform, public properties, and optional recursive children without exposing database or source
  metadata.
- Include properties in `locations.list` through one bounded property read and reject explicitly
  when the complete-tree property response budget is exceeded.
- **BREAKING** Remove `locations.listProperties`; retain exact property search using `type` and
  `value`, but return transformed public locations rather than raw location/property documents.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `location-ingestion`: Preserve source translation keys for localized location and property text,
  provide readable localization fallbacks, and stop persisting raw amenity names.
- `location-properties`: Use typed multivalued properties, define the transformed public location
  contract, include properties in tree reads, bound complete-tree property reads, and revise public
  property query behavior.

## Impact

- Shared location enums, validators, import contracts, and public response types in
  `packages/types` change.
- The TypeScript ingester must retain localization keys and emit the revised clean-break property
  payload.
- The Convex location/property schema, indexes, reconciliation identity, query commands, routes,
  generated API bindings, and tests change.
- Web location runes and selector types consume the transformed response instead of importing a
  backend command type; `_id` and optional leaf `children` remain stable.
- Deployment requires confirming that `locationProperties` has no persisted data that must survive
  the breaking schema replacement; no compatibility layer or data migration is planned.
