## 1. Location Model

- [x] 1.1 Replace the shared `LocationType` taxonomy with the normalized source-backed types and verify `@versetools/types` type checking succeeds.
- [x] 1.2 Add raw `sourceTypeName` provenance to shared location contracts and the Convex `locations` schema, then regenerate Convex types and verify `pnpm --filter @versetools/convex check` passes.
- [x] 1.3 Define canonical CIG-GUID-based generation and batch payloads with nullable `parentCigGuid`, valid and invalid GUID classifications, and validation for the supported type mapping; verify malformed payload cases are rejected.

## 2. Source Extraction

- [x] 2.1 Extend the TypeScript ingester to traverse the MegaMap universe, solar-system records, root SOCpaks, and recursively reachable relevant child SOCpaks; verify the extracted candidate count and sample hierarchy against the old `locations_map.json` output.
- [x] 2.2 Convert system and `StarMapObject` records into canonical candidates with localized names, raw type provenance, source parent GUIDs with enclosing-container fallback, and uncomposed galactic or solar transforms; verify representative system, planet, and nested location records.
- [x] 2.3 Implement explicit raw-type normalization, recurse through structural containers without a `starMapRecord`, skip and log unresolvable declared records, and fail before any Convex request for unknown source types; verify hard failures leave reconciliation uninvoked.
- [x] 2.4 Detect recursive SOCpak cycles and duplicate CIG GUID placements, retaining the first candidate and logging later placements with source context; verify duplicate identities do not overwrite the first candidate and distinct GUIDs sharing a transform remain present.
- [x] 2.5 Build the parent-first valid tree and invalid GUID set after extraction, logging candidates with unresolved parents and propagating invalidity to unattached descendants; verify valid sibling branches remain eligible for ingestion.

## 3. Convex Reconciliation

- [x] 3.1 Add secret-authenticated internal mutations to begin, reconcile, abort, rebuild, and finalize an import generation, resolving all source and parent identities by CIG GUID and rejecting pre-existing duplicate database identities; verify callers cannot supply Convex location IDs as ingestion identity.
- [x] 3.2 Reconcile valid candidates in bounded parent-first batches by updating documents and parent relationships without unbounded closure work; verify creates, changed attributes, and reparenting preserve IDs within measured Convex payload, transaction, execution, and I/O limits.
- [x] 3.3 Rebuild location closure rows in bounded parent-first batches after reconciliation and reject location tree reads while rebuilding; verify reads resume only after a consistent closure tree is restored.
- [x] 3.4 Record valid and invalid source GUID classifications per successful import batch, support abort only before the first successful batch, and finalize stale cleanup only after every expected batch completes; verify an early aborted generation restores tree reads while a later failed generation remains resumable.
- [x] 3.5 Remove stored locations absent from the valid GUID classification or marked invalid by a finalized generation, including their closure and property records; verify invalid and stale subtrees leave no dangling rows within Convex write and I/O limits.
- [x] 3.6 Detect manual moves whose closure update exceeds the safe threshold and route them through the bounded rebuild workflow; verify a large move does not use unbounded closure writes.
- [x] 3.7 Add `@versetools/convex-client` as an ingester workspace dependency, construct its `createHttpClient` with the configured URL and secret, and submit conservatively sized batches only after local extraction and validation complete; verify a successful local run updates the configured Convex location tree.
- [x] 3.8 Aggregate duplicate-placement and invalid-parent anomaly diagnostics with bounded representative samples; verify logs stay within Convex line count and line-size limits for a high-anomaly fixture.

## 4. Verification

- [x] 4.1 Add focused tests for type normalization, structural-container traversal, unresolvable starmap-record skipping, duplicate placement retention, parent-skip propagation, generation finalization, incomplete-generation safety, and stale-deletion eligibility; verify the affected test suite passes.
- [x] 4.2 Measure production-sized import payloads and closure-table write amplification, select conservative batch limits below the applicable Convex function limits, and document the measurements with the implementation.
- [x] 4.3 Validate the affected packages with `pnpm --filter @versetools/convex check`, relevant ingester checks or type checking, `pnpm check`, and `pnpm lint`; report any environment-specific inability to run a game-data ingestion.
