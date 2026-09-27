## 1. Shared Location Contracts

- [x] 1.1 Add `LocationPropertyType` and typed amenity display-name fallbacks to the shared location
      exports, then replace property `key`, `displayName`, and `sourceName` contracts with `type`, `name`,
      and optional `nameTranslationKey`; verify enum, accepted payload, duplicate semantic identity, and
      rejected value cases with schema tests plus `pnpm --filter @versetools/types check` and
      `pnpm --filter @versetools/types lint`.
- [x] 1.2 Add optional location name/description translation keys to create, update, and ingestion
      schemas and ensure they remain part of bounded import payloads; verify localized, literal, and null
      field combinations in affected schema tests.
- [x] 1.3 Define shared recursive public location and discriminated public property response types
      with branded `_id`, grouped transform, nullable description/rotation, always-present properties,
      and optional children; verify compile-time examples accept the intended shape and reject leaked
      persistence fields or unconstrained amenity values.
- [x] 1.4 Replace exact property-search input with a type-discriminated schema and remove the bounded
      standalone property-list input/output contracts; verify amenity value and pagination bounds in
      schema tests.

## 2. Localization-Aware Extraction

- [x] 2.1 Replace string-only text extraction with resolved-text plus optional-translation-key
      handling for location names and descriptions, carrying both through snapshots, hashes, batches,
      and measurements; verify resolved identifiers, literal text, absent descriptions, stable hashes,
      and changed-key hashes in ingester tests.
- [x] 2.2 Emit amenity properties with typed `type`, normalized value, localized `name`, optional
      `nameTranslationKey`, source provenance, and icon while keeping raw CIG names transient; verify
      successful localization, unresolved-key fallback, and absence of persisted `sourceName` in unit
      tests.
- [x] 2.3 Give derived external freight elevators the shared readable fallback name with no invented
      translation key and preserve deterministic deduplication by type/value; verify repeated placements
      still produce one complete property payload.
- [x] 2.4 Update dry-run reporting with total public-property count and proposed complete-tree budget
      headroom, then run `pnpm --filter @versetools/sc-data-ingester test` and
      `pnpm exec tsc -p apps/sc-data-ingester/tsconfig.json`.

## 3. Convex Property Persistence

- [x] 3.1 Apply the clean-break Convex schema replacement for property type/name/translation key,
      add optional location translation-key fields, and replace key-based indexes with
      location/type/value and type/value indexes while retaining location/source reconciliation access;
      verify schema compilation with `pnpm --filter @versetools/convex check`.
- [x] 3.2 Reconcile semantic properties by location/type/value, patch changed localized metadata and
      provenance, retain source-specific deletion rules, and fail explicitly on duplicate persisted
      semantic facts; verify create, metadata update, stale deletion, partial physical preservation,
      unrelated-row preservation, and retry idempotency with `convex-test`.
- [x] 3.3 Update transaction-limit fixtures for the revised payload and indexes and confirm maximum
      supported batches remain below documented argument, read, range, concurrency, execution, and
      write limits with explicit headroom.

## 4. Public Location Transformation And Reads

- [x] 4.1 Add a pure location transformer that returns the shared response type, validates the
      three-number position invariant, groups transform fields, sorts and strips public properties,
      preserves nulls, and recursively retains optional children; verify exact output, private-field
      omission, leaf behavior, and malformed-position failure in focused tests.
- [x] 4.2 Calculate and document a safe complete-tree property limit from measured row sizes and
      Convex limits, then add a bounded `limit + 1` property query that returns all rows or an explicit
      limit error; verify boundary success and overflow rejection without an unbounded collect.
- [x] 4.3 Join the bounded property set into `locations.list`, group once by location ID, and transform
      every root tree; verify locations with multiple and zero properties, nullable fields, nested
      children, rebuild rejection, and no per-location property-query fan-out.
- [x] 4.4 Change exact type/value search to return paginated transformed locations with each result's
      complete public property set, then verify normal, empty, pagination, metadata stripping, and active-
      rebuild behavior with `convex-test`.
- [x] 4.5 Remove the public `locations.listProperties` route and its command/tests, regenerate Convex
      API bindings through the CLI, and verify route/type agreement with
      `pnpm --filter @versetools/convex check` and `pnpm --filter @versetools/convex test`.

## 5. Web Client Integration

- [x] 5.1 Update the location rune and selector types to consume the shared transformed response
      rather than importing `LocationTreeQuery` internals, preserving `_id` selection, optional leaf
      children, parent backlinks, search, and navigation; verify with focused type inspection and
      `pnpm --filter @versetools/web check`.
- [x] 5.2 Add or update client-facing fixtures to prove Convex query inference exposes grouped
      transform data and typed properties while excluding persistence/source fields; verify the affected
      web tests or package check passes.

## 6. Integration And Validation

- [x] 6.1 Add an end-to-end fixture from localized extraction through reconciliation and transformed
      tree/search reads, covering translation keys, multiple amenities, the physical fallback name,
      incomplete physical inspection, metadata updates, and idempotent replay; verify all affected
      ingester and Convex tests pass.
- [x] 6.2 Run a controlled LIVE `--dry-run` without reconciliation and verify readable localized
      property names, retained translation-key counts, unchanged semantic property/location totals, and
      measured headroom beneath the complete-tree property budget.
- [x] 6.3 Before deployment, verify the target `locationProperties` table has no durable rows; stop
      and require a migration plan if rows exist rather than deleting or deploying over them. The
      authorized local cleanup removed 1,196 legacy rows, and the follow-up query returned no documents.
- [x] 6.4 Run `pnpm check`, `pnpm lint`, and `git diff --check`, review generated files and API removals,
      and record any unrelated repository failures or environment-dependent checks that could not run.
