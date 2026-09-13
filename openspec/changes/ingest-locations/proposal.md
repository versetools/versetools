## Why

VerseTools has a native Star Citizen data reader and a Convex location tree, but no ingestion path between them. The current ingester only logs universe records, leaving location data unavailable to consumers and making game-data updates manual.

## What Changes

- Traverse the MegaMap universe record and recursively follow relevant SOCpak object-container hierarchies to extract game locations.
- Normalize supported DataCore location types into a VerseTools taxonomy while retaining raw type names and CIG GUIDs as provenance.
- Add an authenticated internal Convex reconciliation operation that uses location `cigGuid` values, rather than Convex document IDs, as ingestion identities, invoked through `@versetools/convex-client`.
- Reconcile complete valid source snapshots by creating, updating, reparenting, and removing imported locations without leaving dangling closure or property records.
- Detect and report malformed source data according to defined failure, skip, and duplicate-handling behavior.

## Capabilities

### New Capabilities
- `location-ingestion`: Extract, validate, normalize, and reconcile the authoritative Star Citizen location tree.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/sc-data-ingester`, `apps/sc-data-extractor`, `apps/convex`, and `packages/types` location schemas and exports.
- Affected data: Convex `locations`, `locationClosures`, and `locationProperties` tables.
- Affected internal API: a new secret-authenticated Convex ingestion mutation and a canonical CIG-GUID-based ingestion payload.
- Affected dependency: `@versetools/sc-data-ingester` consumes `@versetools/convex-client` for its secret-authenticated HTTP client.
