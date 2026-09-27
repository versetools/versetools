## Context

See `proposal.md` for motivation. The current ingester resolves localized text directly to strings,
so the originating `@` identifiers are discarded. Amenity properties persist `key`, `value`, raw
`sourceName`, resolved `displayName`, icon, and source provenance. Convex returns raw location and
property documents from public routes, while the web application imports the backend tree command's
type and depends on `_id` plus omitted `children` for leaves.

The complete location tree already reads about 2,000 location documents. Current LIVE data has only
about 300 game-derived property rows, but the schema permits up to 26 properties per location, so an
unbounded property-table read cannot be justified solely by current volume. Convex indexes do not
enforce uniqueness, and every complete-tree read must remain within transaction and response limits.

## Goals / Non-Goals

**Goals:**

- Establish one typed semantic property model that can add future property categories without using
  arbitrary string keys.
- Preserve source localization keys without exposing ingestion or persistence details in public
  location responses.
- Make complete-tree and exact-search responses share one type-safe transformation boundary.
- Include properties in complete-tree responses without N+1 location-property queries or an
  unbounded table scan.
- Keep source-specific reconciliation, incomplete physical-scan preservation, and batch idempotency.

**Non-Goals:**

- Runtime locale selection or client-side translation from stored source keys.
- Exposing property icons, source references, translation keys, or CIG identifiers publicly.
- Preserving existing `locationProperties` documents through the breaking schema replacement.
- Materializing a second copy of public properties on each location document.
- Changing `_id`, nullable descriptions or rotations, or the optional `children` behavior for leaves.

## Decisions

### Use property type and value as semantic identity

Add `LocationPropertyType` to the shared types package with `Amenity = "amenity"` as its initial
value. Persist `type`, normalized `value`, localized `name`, optional `nameTranslationKey`, source,
source reference, and optional icon. Remove `key`, `displayName`, and `sourceName` in one clean break.

The semantic uniqueness invariant becomes `(locationId, type, value)`. Source remains reconciliation
ownership and provenance rather than part of semantic identity. Convex will index location/type/value
for explicit `.unique()` checks, location/source for reconciliation, and type/value for exact search.
Shared ingestion schemas will reject repeated semantic identities before Convex is called.

Keeping `source` in identity was rejected because two sources asserting the same semantic fact would
produce duplicate public properties after source fields are hidden. Modeling each amenity as a
property type was rejected because `amenity` is a useful category and clients need a stable type/value
filter contract.

### Preserve localization values and keys as a pair

Replace the ingester's string-only localization helper with a helper that returns resolved text and
an optional translation key. A source string beginning with `@` is retained as the key and passed to
the native localization lookup; literal text has no translation key. Location name and description
payloads carry their keys through hashing, batching, import, and persistence.

Amenity normalization still uses the transient raw CIG name, but that raw name is not included in
the property payload or database. A typed amenity-name map supplies readable fallback text when an
amenity display key cannot be resolved and names the derived external freight-elevator fact, which
has no CIG translation key. Existing unresolved-location behavior remains unchanged because no
independent authoritative fallback exists for arbitrary location keys.

Failing all extraction on a missing translation was rejected because localization gaps should not
invalidate otherwise normalized game data. Storing only translation keys was rejected because
public reads must not depend on DataCore or a runtime localization service.

### Define the public response contract in shared types

Define shared public response types for a recursive location and its properties. The location
response retains branded `_id`, name, nullable description, and normalized location type. It groups
world space, surface state, a validated three-number position tuple, and nullable quaternion under
`transform`; contains an always-present property array; and keeps `children` optional for leaves.
Public property responses are a discriminated union keyed by `LocationPropertyType`, allowing
`Amenity` properties to expose a `LocationAmenity` value rather than an unconstrained string.

The response deliberately omits `_creationTime`, `parentId`, CIG identity and type provenance,
translation keys, property source data, and icons. Route handlers and transformers explicitly return
the shared response types so generated Convex API consumers infer the contract. The web application
will import the shared type instead of the backend command type.

Returning raw documents was rejected because it couples clients to schema migrations. Renaming `_id`
to `id` was rejected because `_id` is already a branded, stable client identifier and existing UI
code relies on it. Always returning `children: []` was rejected because current selector navigation
uses omission to distinguish leaves.

### Use one pure transformer for tree and search responses

Add a backend location transformer that accepts a location document or raw tree node plus properties
grouped by location ID and returns the shared public response type. It validates the stored position
length before producing a tuple, maps nullable fields without defaults, sorts public properties
deterministically, strips private fields, and recursively transforms present children.

Exact property search will load all properties for each location in the bounded result page and use
the same transformer with no children. This keeps one public representation across routes. A DI
service was rejected because transformation is deterministic and has no runtime dependencies; a
pure class or module provides the requested boundary without container wiring.

### Join complete-tree properties with one bounded read

The complete-tree route will fetch the raw location forest and execute one property query using
`.take(limit + 1)`. A named limit will be calculated from documented Convex read/response limits and
measured serialized row sizes with explicit headroom. If the extra row exists, the query throws an
explicit property-read-limit error. Otherwise the route groups rows by location ID and transforms the
forest.

Per-location index queries were rejected because the current tree would require roughly 2,000 index
ranges and I/O operations. Denormalizing public properties onto location documents was rejected
because it creates a second representation that every future property mutation must maintain.
Unbounded `.collect()` was rejected because the schema's theoretical maximum exceeds safe function
limits even though current LIVE volume is small.

### Remove standalone listing and transform exact search

Remove the public `locations.listProperties` route, bounded-ID input schema, command, tests, and
generated binding because complete-tree reads now include properties and there are no repository
consumers of the route. Rename exact search input from `key` to `type` and make it a discriminated
schema so each property type constrains its value vocabulary.

Exact search continues to paginate through the type/value index. Semantic uniqueness guarantees at
most one matching property per location, so each result page can return transformed locations
without duplicate locations or a redundant raw matching-property wrapper. For each bounded page,
all properties for those locations are loaded through location indexes before transformation.

## Risks / Trade-offs

- [A future game build exceeds the complete-tree property budget] -> Reject explicitly, report the
  measured count in dry-run output, and revisit pagination or a materialized read model before
  increasing the limit.
- [A semantic value is later asserted by multiple source kinds] -> Keep one semantic row and require
  an explicit source-ownership rule before adding overlapping extractors; current declared and
  physical amenity vocabularies do not overlap.
- [A position document does not contain exactly three numbers] -> Treat it as a database invariant
  failure in the transformer instead of returning an incorrectly typed tuple.
- [Translation lookup changes between imports] -> Reconciliation updates localized values and keys
  in place while semantic type/value identity remains stable.
- [A clean-break deployment finds existing manual properties] -> Stop deployment and choose a
  migration strategy; do not silently delete data or deploy an invalid required-field schema.
- [Removing `listProperties` breaks an external consumer not present in the repository] -> Treat the
  route removal as an announced breaking API change and coordinate deployment with known clients.

## Migration Plan

1. Verify each target Convex deployment has no `locationProperties` rows that must survive. Stop if
   manual or otherwise durable rows exist.
2. Deploy shared contracts, the breaking Convex property schema/indexes, transformed routes, and
   regenerated API bindings together.
3. Deploy the revised ingester and web client against the generated API contract.
4. Run a non-mutating LIVE extraction to verify translation-key capture, readable amenity names,
   property totals, and headroom beneath the complete-tree read budget.
5. Run a controlled location import, then verify transformed tree and exact-search responses.

Before the first import, rollback restores the prior application/schema versions. After new property
rows exist, rollback requires clearing those regenerable rows before restoring the prior schema, then
rerunning the prior ingester; location documents remain compatible because their new translation-key
fields are additive and optional at the database layer during rollback.
