## Context

See proposal.md for motivation and `specs/location-ingestion/spec.md` for the behavior contract. The native extractor can resolve DataCore records by GUID and recursively expose SOCpak child containers. The old Python exporter establishes the source traversal, but filters hidden locations, preserves raw type labels, and exports a file rather than synchronizing a database.

Convex stores locations as an adjacency tree (`parentId`) with a closure table for subtree and ancestor queries. Existing location mutations operate on Convex IDs, while the CIG GUID index is available for source identity lookup. Deleting a location currently does not remove its `locationProperties` rows.

## Goals / Non-Goals

**Goals:**

- Build a complete, validated in-memory source snapshot before changing Convex.
- Make CIG GUIDs the only cross-run identity used by ingestion.
- Reconcile the stored tree without replacing stable Convex document IDs for unchanged locations.
- Preserve raw game type provenance while exposing a bounded, normalized VerseTools taxonomy.
- Make malformed source data visible without incorrectly deleting prior data.

**Non-Goals:**

- Filtering locations according to visibility, gameplay, or player-facing flags.
- Ingesting location amenities, jurisdictions, images, inventories, scale, or additional starmap metadata.
- Supporting manually curated locations in the shared `locations` table.
- Changing coordinate frames or deriving global transforms from nested local transforms.
- Recovering from a source location with no `starMapRecord`; this is a hard failure for the first iteration.

## Decisions

### Extract first, reconcile second

The ingester will first construct an in-memory candidate set keyed by `cigGuid`, then validate types and build a parent-first valid tree. It will call Convex only after traversal has completed without hard failures.

```text
MegaMap -> SSolarSystem -> root SOCpak -> nested SOCpaks
                                   |
                                   v
                         candidates by cigGuid
                                   |
                            validate / attach
                                   |
                                   v
                  bounded reconciliation batches
```

This separates read failures from mutation and ensures an unknown type or missing `starMapRecord` preserves the prior database snapshot. Calling create and update endpoints during traversal was rejected because a later hard failure would leave a partial tree.

### Represent source trees with canonical GUID relationships

The ingestion payload will use `cigGuid` and nullable `parentCigGuid`, never Convex location IDs. The reconciliation mutation resolves parent GUIDs to stored IDs and applies records in parent-before-child order.

```text
ingester:  { cigGuid: child, parentCigGuid: parent }
                         |
                         v
Convex:    parent GUID -> parent _id -> child.parentId
```

This retains stable Convex IDs for existing records, supports moves, and isolates the closure-table implementation. Replacing the complete database tree was rejected because it invalidates IDs, exposes transient empty data, and makes partial ingest damage harder to identify.

### Use the shared secret-authenticated Convex client

The ingester will depend on `@versetools/convex-client` and construct its HTTP client through `createHttpClient({ url, secret })`. This follows the existing service-client convention and passes the secret expected by the Convex secret-key middleware without duplicating client wrapping or authentication logic.

Creating a direct `ConvexHttpClient` or a bespoke HTTP request layer was rejected because the workspace package already centralizes secret-aware calls and safe result handling.

### Normalize source types while retaining provenance

`LocationType` will be replaced by the agreed normalized taxonomy: `system`, `star`, `planet`, `moon`, `asteroid`, `outpost`, `landing_zone`, `nav_point`, `point_of_interest`, and `manmade`. The location record will retain `sourceTypeName` and `typeCigGuid`.

The mapping is explicit and exhaustive for the currently observed source types. Unknown source types fail the full ingestion before reconciliation. Persisting raw labels keeps mapping changes diagnosable without allowing implementation-specific values to define the product API. Storing only type GUIDs was rejected because the raw name is useful source provenance and operational diagnostics.

### Classify every encountered GUID for safe stale cleanup

Traversal produces three categories:

```text
valid      -> reconcile
skipped    -> preserve existing row
absent     -> remove as stale after a successful run
```

Candidates with a declared parent that cannot be ingested are logged and classified as skipped; their unattached descendants are also skipped. A candidate absent from the traversal is stale only if it was neither valid nor skipped. This prevents malformed parent data from deleting a prior valid branch.

The reconciliation operation removes stale locations only after the import generation has successfully completed every batch. It deletes affected closure rows and `locationProperties` rows with deleted locations.

### Reconcile in bounded import generations

Convex mutation limits prohibit assuming that a full location snapshot and its closure-table changes fit in one request. In particular, a function has a 16 MiB argument limit, one second of user-code execution, 16 MiB of reads and writes, 16,000 document writes, 4,096 index ranges, 1,000 concurrent I/O operations, and 256 log lines. The ingestion protocol will create an import generation, submit parent-first batches sized to remain below these limits, then finalize the generation.

```text
validated snapshot
        |
        v
begin generation
        |
        v
batch 1 -> batch 2 -> ... -> batch N
        |                         |
        x any failure             v
        |                    finalize generation
        v                         |
no stale cleanup                  v
                           remove confirmed stale data
```

Each successful batch records its valid and skipped GUID classifications for the generation. Finalization identifies stale rows only after all expected batches succeed, so an interrupted run cannot delete records merely because later batches never arrived. Batch sizing must account for closure rows generated by inserts, moves, and deletes, rather than count location records alone. The ingester will report anomaly counts and bounded samples per batch or run instead of emitting unbounded per-record log lines.

Sending a single full snapshot was rejected because its payload, database work, closure writes, index reads, and diagnostic logs are all bounded by Convex limits. A fully staged duplicate location tree was rejected because it increases storage and migration complexity without being required for safe generation finalization.

### Retain first duplicate placements

When the same `cigGuid` is encountered multiple times, the first candidate wins. Later placements are logged with the source container and transform and do not change the retained candidate. Distinct GUIDs with identical transforms are valid and retained. Failing on duplicate placements was rejected because the game data may legitimately expose a starmap record through multiple containers.

### Use source-provided parent identity with container fallback

For a `StarMapObject`, its source `parent` GUID is authoritative when present. When absent, the traversal's enclosing location supplies the parent GUID, matching the old extractor behavior. Solar-system records are roots and use galactic coordinates; object-container locations use their supplied solar transform. The system will not compose transforms across frames.

## Risks / Trade-offs

- [A future game build introduces a raw type] -> The run fails before database mutation; extend and test the explicit mapping before retrying.
- [A malformed parent skips a branch] -> The anomaly and skipped GUIDs are logged, and existing matching database records remain rather than being deleted.
- [A batch approaches a Convex function limit] -> Use conservative batch sizing based on measured payload bytes, closure-write amplification, and index/I/O use; reduce or split the batch before retrying.
- [An interrupted import leaves a partially updated tree] -> Do not finalize its generation or perform stale cleanup; a later complete generation converges the tree.
- [High anomaly volume drops useful diagnostics] -> Log aggregate counts and a bounded set of representative anomalies within Convex log-line and line-size limits.
- [Recursive SOCpak references form cycles or repeat work] -> Track visited container paths during traversal and report unreadable required containers as extraction failures.
- [Existing duplicate CIG GUID rows] -> Reconciliation rejects the ambiguous database state rather than choosing an arbitrary row; repair is required before ingestion continues.
- [Delete logic misses a dependent table added later] -> Keep cleanup ownership in the reconciliation/delete boundary and update it whenever a new location foreign key is introduced.

## Migration Plan

1. Extend the shared location schemas and Convex schema for the normalized taxonomy and `sourceTypeName`.
2. Add source snapshot extraction and a secret-authenticated, generation-based reconciliation operation, invoked by the ingester through `@versetools/convex-client`.
3. Run an initial ingestion against a local or controlled Convex deployment and review type, duplicate, and skipped-parent logs.
4. Deploy the updated schema and run the ingester to populate the authoritative tree.
5. Roll back application code if necessary; the prior location snapshot remains until a later successful reconciliation. If a bad successful import must be reversed, restore from a Convex export or rerun against the intended game build.
