## 1. Location Model

- [ ] 1.1 Replace the shared `LocationType` taxonomy with the normalized source-backed types and verify `@versetools/types` type checking succeeds.
- [ ] 1.2 Add raw `sourceTypeName` provenance to shared location contracts and the Convex `locations` schema, then regenerate Convex types and verify `pnpm --filter @versetools/convex check` passes.
- [ ] 1.3 Define canonical CIG-GUID-based generation and batch payloads with nullable `parentCigGuid`, valid and skipped GUID classifications, and validation for the supported type mapping; verify malformed payload cases are rejected.

## 2. Source Extraction

- [ ] 2.1 Extend the TypeScript ingester to traverse the MegaMap universe, solar-system records, root SOCpaks, and recursively reachable relevant child SOCpaks; verify the extracted candidate count and sample hierarchy against the old `locations_map.json` output.
- [ ] 2.2 Convert system and `StarMapObject` records into canonical candidates with localized names, raw type provenance, source parent GUIDs with enclosing-container fallback, and uncomposed galactic or solar transforms; verify representative system, planet, and nested location records.
- [ ] 2.3 Implement explicit raw-type normalization, failing before any Convex request for missing `starMapRecord` or unknown source types; verify both failure cases leave reconciliation uninvoked.
- [ ] 2.4 Detect recursive SOCpak cycles and duplicate CIG GUID placements, retaining the first candidate and logging later placements with source context; verify duplicate identities do not overwrite the first candidate and distinct GUIDs sharing a transform remain present.
- [ ] 2.5 Build the parent-first valid tree and skipped GUID set after extraction, logging candidates with unresolved parents and propagating skips to unattached descendants; verify valid sibling branches remain eligible for ingestion.

## 3. Convex Reconciliation

- [ ] 3.1 Add secret-authenticated internal mutations to begin, reconcile, and finalize an import generation, resolving all source and parent identities by CIG GUID and rejecting pre-existing duplicate database identities; verify callers cannot supply Convex location IDs as ingestion identity.
- [ ] 3.2 Reconcile valid candidates in bounded parent-first batches using the existing create, data-update, and move tree mechanics while preserving IDs for matching CIG GUIDs; verify creates, changed attributes, and reparenting yield a consistent closure tree within measured Convex payload, transaction, execution, and I/O limits.
- [ ] 3.3 Record valid and skipped source GUID classifications per successful import batch and finalize stale cleanup only after every expected batch completes; verify a failed or incomplete generation preserves existing potentially stale records.
- [ ] 3.4 Remove only stored locations absent from both valid and skipped GUID classifications of a finalized generation, including their closure and property records; verify skipped records survive and confirmed stale subtrees leave no dangling rows within Convex write and I/O limits.
- [ ] 3.5 Add `@versetools/convex-client` as an ingester workspace dependency, construct its `createHttpClient` with the configured URL and secret, and submit conservatively sized batches only after local extraction and validation complete; verify a successful local run updates the configured Convex location tree.
- [ ] 3.6 Aggregate duplicate and invalid-parent anomaly diagnostics with bounded representative samples; verify logs stay within Convex line count and line-size limits for a high-anomaly fixture.

## 4. Verification

- [ ] 4.1 Add focused tests for type normalization, duplicate placement retention, missing starmap-record failure, parent-skip propagation, generation finalization, incomplete-generation safety, and stale-deletion eligibility; verify the affected test suite passes.
- [ ] 4.2 Measure production-sized import payloads and closure-table write amplification, select conservative batch limits below the applicable Convex function limits, and document the measurements with the implementation.
- [ ] 4.3 Validate the affected packages with `pnpm --filter @versetools/convex check`, relevant ingester checks or type checking, `pnpm check`, and `pnpm lint`; report any environment-specific inability to run a game-data ingestion.
