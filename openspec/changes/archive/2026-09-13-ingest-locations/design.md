## Context

See proposal.md for motivation and `specs/location-ingestion/spec.md` for the behavior contract. The native extractor can resolve DataCore records by GUID and recursively expose SOCpak child containers. The old Python exporter establishes the source traversal, but filters hidden locations, preserves raw type labels, and exports a file rather than synchronizing a database.

Convex stores locations as an adjacency tree (`parentId`) with a closure table for subtree and ancestor queries. Existing location mutations operate on Convex IDs, while the CIG GUID index is available for source identity lookup. Existing move logic updates the complete moved subtree synchronously and is not safe for arbitrarily large source or manual moves.

## Goals / Non-Goals

**Goals:**

- Build a complete, validated in-memory source snapshot before changing Convex.
- Make CIG GUIDs the only cross-run identity used by ingestion.
- Reconcile the stored tree without replacing stable Convex document IDs for unchanged locations.
- Preserve raw game type provenance while exposing a bounded, normalized VerseTools taxonomy.
- Make malformed source data visible without retaining invalid unattached branches.

**Non-Goals:**

- Filtering locations according to visibility, gameplay, or player-facing flags.
- Ingesting location amenities, jurisdictions, images, inventories, scale, or additional starmap metadata.
- Supporting manually curated locations in the shared `locations` table.
- Changing coordinate frames or deriving global transforms from nested local transforms.
- Recovering metadata for a declared `starMapRecord` that cannot be resolved.

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

This separates read failures from mutation and ensures an unknown type preserves the prior database snapshot. A declared but unresolvable `starMapRecord` is logged and classified as invalid before reconciliation. Calling create and update endpoints during traversal was rejected because a later hard failure would leave a partial tree.

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

`LocationType` will use the normalized taxonomy defined by the location-ingestion specification, including semantic mappings for implementation and game-mode variants. The location record will retain `sourceTypeName` and `typeCigGuid`.

The mapping is explicit and exhaustive for the currently observed source types. Unknown source types fail the full ingestion before reconciliation. Persisting raw labels keeps mapping changes diagnosable without allowing implementation-specific values to define the product API. Storing only type GUIDs was rejected because the raw name is useful source provenance and operational diagnostics.

### Classify every encountered GUID for safe stale cleanup

Traversal produces three categories:

```text
valid      -> reconcile
invalid    -> remove after successful reconciliation
absent     -> remove as stale after successful reconciliation
```

Candidates with a declared parent that cannot be ingested are logged and classified as invalid; their unattached descendants are also invalid. Finalization removes invalid candidates along with candidates absent from the traversal. This prevents an old parent-child branch from surviving when its source parent has been removed.

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

Each successful batch records valid and invalid GUID classifications for the generation. Finalization identifies stale and invalid rows only after all expected batches succeed, so an interrupted run cannot delete records merely because later batches never arrived. Batch sizing must account for closure rows generated by inserts, moves, and deletes, rather than count location records alone. The ingester will report anomaly counts and bounded samples per batch or run instead of emitting unbounded per-record log lines.

Sending a single full snapshot was rejected because its payload, database work, closure writes, index reads, and diagnostic logs are all bounded by Convex limits. A fully staged duplicate location tree was rejected because it increases storage and migration complexity without being required for safe generation finalization.

An authenticated abort operation is available only before the first reconciliation batch succeeds. It removes the pending generation and rebuild tracking state, leaving the existing locations and closure table unchanged so tree reads resume. Once any batch succeeds, abort is rejected because location documents may have changed; the ingester must resume the idempotent generation and complete cleanup and rebuilding. A later successful import remains the recovery path for malformed source data.

### Production-size measurements and limits

The live snapshot measured on 2026-09-13 contains 1,191 valid locations, one invalid GUID, 49 batches, and three roots. The 49 batches comprise 47 full 25-location batches, one 16-location batch, and one invalid-GUID batch. Serializing the exact objects returned by `batchLocations`, including each batch hash, produced 624,012 bytes total: 154 bytes minimum, 12,944 bytes median, and 14,563 bytes maximum per batch.

The measured tree has maximum depth 5 and produces 4,785 closure rows, an amplification of 4.018 closure rows per location. The deepest location therefore creates at most six closure rows. A 25-location import batch can create at most 150 closure rows at the observed depth, and each rebuild step separately limits ancestor closure creation, child discovery, or root discovery to 25 rows. This is deliberately far below Convex's 16 MiB argument/read/write limits, 16,000-write limit, and 1,000 concurrent-I/O limit; the largest measured payload is less than 0.1% of the argument limit.

`25` remains the location import and closure-rebuild batch size. `100` remains both the closure-clear batch size and the maximum combined old-link deletions plus new-link creations allowed for a synchronous manual move. Larger manual moves only patch `parentId` and enter the bounded rebuild, while ordinary moves at or below 100 closure mutations remain immediately consistent. These limits leave substantial margin for location/member writes, indexes, scheduler bookkeeping, and future depth growth rather than sizing directly against the current snapshot.

### Rebuild closures separately and block tree reads

Import batches update location documents and `parentId` relationships without invoking per-move closure reconstruction. After the final location batch, the generation enters a rebuilding state. Bounded work clears and recreates closure rows in parent-first order. Location tree reads reject with a rebuild-in-progress error while this state is active, preventing consumers from observing disagreement between `parentId` and the closure table.

```text
location document batches
        |
        v
stale cleanup -> rebuild active -> tree reads rejected
        |
        v
bounded closure delete / create batches
        |
        v
generation finalized -> tree reads resume
```

The same rebuild state is reused for manual moves whose subtree and ancestor closure work exceeds a conservative threshold. Small manual moves retain the existing synchronous closure update path. This avoids duplicating a second batching strategy while keeping ordinary edits immediately consistent.

### Retain first duplicate placements

When the same `cigGuid` is encountered multiple times, the first candidate wins. Later placements are logged with the source container and transform and do not change the retained candidate. Distinct GUIDs with identical transforms are valid and retained. Failing on duplicate placements was rejected because the game data may legitimately expose a starmap record through multiple containers.

### Use source-provided parent identity with container fallback

For a `StarMapObject`, its source `parent` GUID is authoritative when present. When absent, the traversal's enclosing location supplies the parent GUID, matching the old extractor behavior. Solar-system records are roots and use galactic coordinates; object-container locations use their supplied solar transform. The system will not compose transforms across frames.

## Risks / Trade-offs

- [A future game build introduces a raw type] -> The run fails before database mutation; extend and test the explicit mapping before retrying.
- [A malformed parent invalidates a branch] -> The anomaly is logged and the stored branch is removed only after a complete generation finalizes.
- [A batch approaches a Convex function limit] -> Use conservative batch sizing based on measured payload bytes, closure-write amplification, and index/I/O use; reduce or split the batch before retrying.
- [An interrupted import leaves a partially updated tree] -> Do not finalize its generation or perform stale cleanup; a later complete generation converges the tree.
- [An early import failure blocks tree reads] -> Allow the authenticated ingester to abort before any batch succeeds, removing only generation tracking state.
- [A later import batch fails] -> Retain the active generation and require the ingester to resume idempotent batches until cleanup and rebuilding restore tree consistency.
- [Closure data is temporarily inconsistent] -> Mark rebuild active and reject `locations.list` until bounded closure work completes.
- [A manual move exceeds a mutation's limits] -> Detect it before mutation and route the move through the shared bounded rebuild workflow.
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
