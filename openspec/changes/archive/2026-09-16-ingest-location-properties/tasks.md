## 1. Shared Property Contracts

- [x] 1.1 Add normalized amenity values, property source kinds, provenance metadata, and physical-
  scan completeness to the shared location schemas and public exports; verify with
  `pnpm --filter @versetools/types check` and `pnpm --filter @versetools/types lint`.
- [x] 1.2 Extend location import request and response schemas with bounded property payloads and
  exact property-query inputs, preserving validation of existing location-only fields; verify schema
  acceptance and rejection cases through affected package tests and
  `pnpm --filter @versetools/types check`.

## 2. Native SOCpak Caching

- [x] 2.1 Add canonical path normalization and transparent immutable result caching to Rust
  `read_socpak` without changing its NAPI return contract; verify repeated equivalent-path reads
  parse once in focused Rust tests.
- [x] 2.2 Add extractor coverage for cached success and failure behavior, including differently cased
  or separated equivalent paths, and verify with
  `cargo test --manifest-path apps/sc-data-extractor/Cargo.toml`.
- [x] 2.3 Format, lint, and build the native package; verify with
  `cargo fmt --manifest-path apps/sc-data-extractor/Cargo.toml --check`,
  `pnpm --filter @versetools/sc-data-extractor lint`, and
  `pnpm --filter @versetools/sc-data-extractor build`.

## 3. Location Property Extraction

- [x] 3.1 Add explicit mappings for all current `StarMapAmenityTypeEntry` raw names to normalized
  amenity values and extract GUID, raw name, localized display name, and icon provenance; verify all
  25 known types plus unresolved and unknown-type failures in ingester unit tests.
- [x] 3.2 Replace path-category filtering with recursive traversal of every reachable PU SOCpak while
  preserving placement context, owning location, and cycle protection; verify nested records behind
  flagship, hospital, and hangar paths are returned exactly once per location identity.
- [x] 3.3 Classify canonical paths in the `PU/loc/mod/common/ext_cargo/` module family as
  `external_freight_elevator`, aggregate repeated placements deterministically, and retain source
  path provenance; verify numbered variants match while unrelated cargo and interior elevator paths
  do not.
- [x] 3.4 Distinguish fatal missing root or location-bearing packages from ancillary structural
  misses, propagate per-owner physical-scan completeness, and aggregate useful diagnostics; verify
  fatal, partial, and independent-branch continuation scenarios in traversal tests.
- [x] 3.5 Include sorted properties and completeness in location snapshots, hashes, batches, and
  measurement output; verify equivalent traversal order produces stable hashes and a changed
  property or completeness state changes the snapshot hash.
- [x] 3.6 Run the complete ingester test suite and review updated snapshot/batch measurements; verify
  with `pnpm --filter @versetools/sc-data-ingester test`.

## 4. Convex Property Persistence

- [x] 4.1 Extend `locationProperties` with optional provenance/display fields and indexes for
  location/source uniqueness and exact key/value lookup while retaining legacy key/value rows;
  verify schema and index use with `pnpm --filter @versetools/convex check`.
- [x] 4.2 Reconcile game-derived properties inside each location import batch using semantic diffs,
  preserve unrelated rows, and condition object-container deletion on complete inspection; verify
  create, update, stale-delete, partial-preserve, and retry-idempotency cases with `convex-test`.
- [x] 4.3 Recalculate and enforce safe location batch limits using worst-case property payloads and
  writes, then add limit-focused batch tests; verify measured arguments and operations remain below
  documented Convex limits with explicit headroom.
- [x] 4.4 Add rebuild-aware routes that list properties for bounded location IDs and paginate exact
  key/value matches with their locations; verify normal, empty, pagination, validation, and active-
  rebuild behavior with `convex-test`.
- [x] 4.5 Verify stale-location cleanup still deletes all attached property rows without affecting
  current locations, and add focused cleanup coverage to the Convex test suite.
- [x] 4.6 Regenerate Convex API bindings through the Convex CLI after route changes and verify no
  generated files were hand-edited with `pnpm --filter @versetools/convex check` and
  `pnpm --filter @versetools/convex test`.

## 5. Pipeline Integration And Validation

- [x] 5.1 Wire the enriched snapshot through the ingester's Convex import orchestration and property
  read clients, then verify compile-time API agreement with the types and Convex packages.
- [x] 5.2 Add an end-to-end fixture import covering multiple declared amenities, a physical external
  elevator, duplicate placements, a partial physical scan, and a manual property; verify the final
  database state and an idempotent replay in integration tests.
- [x] 5.3 Run a controlled LIVE-data extraction without reconciliation and verify the report includes
  all 25 declared amenity types, 18 external freight-elevator locations including Levski, the known
  missing ancillary package diagnostic, and the 11 newly reachable locations; do not run ingestion
  if local game data is unavailable.
- [x] 5.4 Run repository validation with `pnpm check` and `pnpm lint`, review the final diff for
  generated artifacts and unrelated edits, and record any environment-dependent validation that
  could not run.
