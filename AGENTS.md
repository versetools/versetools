# AGENTS.md

## Purpose

This file is the repository-wide guide for coding agents working on VerseTools. It applies to
the entire repository unless a more specific `AGENTS.md` exists below the file being changed.

VerseTools is a monorepo for a Star Citizen game-data database and tools platform. Most active
code is TypeScript, Svelte 5, SvelteKit, and Convex. The canonical game-data pipeline is the Rust
extractor plus the TypeScript ingester.

## Working Principles

- Read the relevant package manifest, configuration, and neighboring code before editing.
- Make the smallest change that fully solves the task. Preserve established architecture and
  naming rather than introducing parallel abstractions.
- Keep changes scoped to the requested area. Do not repair unrelated inconsistencies unless the
  user asks for that work.
- Never discard or overwrite changes made by the user or another agent.
- Do not invent commands, environment variables, deployment steps, or compatibility requirements.
- Prefer existing workspace packages and utilities over duplicate local implementations.
- Update public exports when adding public package functionality.
- Use conventional commit messages when the user asks for a commit.

## Toolchain

- Node.js: 24, as pinned by `.node-version`.
- Package manager: pnpm 10.33.2, as pinned by the root `packageManager` field.
- TypeScript: strict configurations shared through root and package `tsconfig` files.
- Frontend: Svelte 5, SvelteKit, Vite, and Tailwind CSS 4.
- Backend: Convex.
- Native extraction: Rust and NAPI-RS on Windows x64 targets.

Run pnpm commands from the repository root unless a command explicitly names another working
directory. Prefer fully qualified package filters, for example
`pnpm --filter @versetools/web check`.

## Installation And Authentication

The `@versetools` and `@l3dev-private` npm scopes use private AWS CodeArtifact registries.
Authentication requires Bash, AWS CLI access, and a valid profile name in the gitignored
`.aws_profile` file. The root `prepare` hook runs `pnpm co:login`, but login failures are suppressed;
an install can therefore fail later while resolving private packages. Run `pnpm co:login` when
private package resolution fails, and report authentication failures without exposing credentials.

## Repository Map

### Applications

- `apps/web`: main SvelteKit website. It contains the landing site, location UI, privacy and data
  request flows, uploads, consent management, internal API routes, and generated metadata routes.
- `apps/convex`: Convex backend, schemas, public/internal functions, workflows, cron jobs, and the
  backend dependency-injection composition root.
- `apps/docs`: statically generated SveltePress documentation and policy site.
- `apps/discord`: Discord bot process.
- `apps/sc-data-extractor`: canonical Rust/NAPI-RS reader for local Star Citizen data.
- `apps/sc-data-ingester`: canonical TypeScript consumer of the native extractor.

### Shared Packages

- `packages/config`: shared product, company, domain, email, and policy metadata.
- `packages/core`: publishable foundational commands, routers, services, errors, requests, helpers, and Haywire
  dependency-injection bindings.
- `packages/convex-client`: publishable shared Convex HTTP/WebSocket clients and Svelte helpers.
- `packages/types`: shared domain types, Zod schemas, and matching Convex validators.
- `packages/rsi`: RSI launcher requests and authentication services.
- `packages/observability`: request/tracing context and Axiom logging transport.
- `packages/ui`: publishable reusable Svelte component library.
- `packages/ui-consent`: publishable consent UI built on `packages/ui`.

### Other Areas

- `.pulumi`: authoritative deployment and infrastructure definitions. Treat app-local Dockerfiles
  as stale unless a task explicitly targets them.
- `openspec`: spec-driven change artifacts and configuration.
- `.github/workflows`: the CI workflow.

## Architecture Boundaries

Keep dependencies flowing from reusable packages toward applications:

```text
config --------------------------------------> apps
core ----------> rsi ------------------------> convex
  |------------> convex-client --------------> web / discord / convex
  |------------> types ----------------------> web / convex
observability -------------------------------> web / discord
ui ------------> ui-consent -----------------> web
sc-data-extractor ---------------------------> sc-data-ingester
```

- Do not import application code into foundational packages such as `packages/core`.
- Put shared domain validation in `packages/types`, not separately in each consumer. Keep Zod and
  Convex validators aligned when changing a shared schema.
- Use `packages/config` for shared static product and company metadata.
- Keep transport-independent service contracts and reusable command/router behavior in
  `packages/core`; compose concrete Convex behavior in `apps/convex`.
- The Convex backend uses command objects, a runner service, custom routing, and Haywire dependency
  injection. Follow those patterns for related backend behavior rather than bypassing them.
- `apps/web` imports Convex generated API and types from `apps/convex/src`. Backend API changes may
  therefore require Convex code generation before web checks pass.
- Preserve the published export maps of `packages/ui`, `packages/ui-consent`, `packages/config`,
  and `packages/observability`. Add new public entry points deliberately and verify package builds.

## Important Entry Points

- Web root layout: `apps/web/src/routes/+layout.svelte`
- Web server hooks: `apps/web/src/hooks.server.ts`
- Web Convex composition: `apps/web/src/lib/convex/server.ts`
- Convex schema: `apps/convex/src/schema.ts`
- Convex HTTP router: `apps/convex/src/http.ts`
- Convex cron jobs: `apps/convex/src/crons.ts`
- Convex DI composition: `apps/convex/src/app/main.ts`
- Discord process: `apps/discord/src/main.ts`
- Docs theme: `apps/docs/theme/index.ts`
- Native extractor: `apps/sc-data-extractor/src/lib.rs`
- Data ingester: `apps/sc-data-ingester/src/index.ts`
- UI public barrel: `packages/ui/src/lib/index.ts`
- Consent UI public barrel: `packages/ui-consent/src/lib/index.ts`

## Coding Conventions

Follow `.prettierrc` and `eslint.config.js`; do not hand-format around them.

- Use tabs, double quotes, semicolons, no trailing commas, and a 100-column print width.
- Let the configured Svelte and Tailwind Prettier plugins order and format component markup and
  utility classes.
- Keep imports ordered by the ESLint configuration, with blank lines between import groups.
- Prefix intentionally unused parameters, variables, and caught errors with `_`.
- Prefer explicit types at public boundaries and let local implementation details infer types when
  clear.
- Follow Svelte 5 and SvelteKit conventions already used in neighboring files. Preserve route-group
  and `+page`/`+layout`/`+server` structure.
- Keep server-only code and private environment access out of browser bundles.
- Use existing error/result abstractions from `packages/core` and safe Convex wrappers where the
  surrounding code uses them.
- Package manifests are ignored by Prettier and normalized by Syncpack. Use `pnpm format` after
  dependency or manifest edits.
- Rust changes must follow `apps/sc-data-extractor/rustfmt.toml` and remain compatible with its
  NAPI-RS interface.

## Environment And Secrets

- Never read, print, edit, or commit `.env`, `.env.*` other than example files, `.aws_profile`,
  local Convex state, credentials, tokens, or production data unless the task explicitly requires
  a safe change to an example or schema.
- Do not place secrets in public SvelteKit variables. Variables prefixed with `PUBLIC_` are exposed
  to browser code.
- Keep environment examples and runtime validation synchronized when adding or renaming variables.
- Do not expose `CONVEX_SECRET`, UploadThing credentials, AWS credentials, Discord credentials,
  Axiom tokens, encryption keys, or Pulumi secrets in logs or responses.
- Infrastructure changes can affect live AWS, Kubernetes, and Cloudflare resources. Do not run
  deployment or destructive Pulumi commands without explicit user authorization.

## Generated And Local Files

Do not manually edit or include generated/local artifacts unless the task is specifically about
their generation:

- `apps/convex/src/_generated/`: generated by Convex.
- `**/.svelte-kit/`, `**/.sveltepress/`, `**/build/`, and `**/dist/`.
- `apps/sc-data-extractor/index.js`, `apps/sc-data-extractor/index.d.ts`, and `*.node`: generated by
  NAPI-RS/native builds.
- `apps/convex/.convex/`: local Convex databases, blobs, exports, and dashboard state.
- Python `.venv`, `__pycache__`, `*.egg-info` and build products.
- Lockfiles must be changed only by their package manager, never manually.

The `(_generated)` directory under `apps/web/src/routes` is a named SvelteKit route group containing
source code; it is not generated output.

## Development Commands

Main development stack:

```sh
pnpm dev
```

This starts Convex and the web application concurrently. Individual processes:

```sh
pnpm dev:convex
pnpm dev:web
pnpm dev:discord
pnpm dev:docs
```

Known development ports are web `5170`, docs `5171`, UI preview `5533`, and consent UI preview
`5534`. Do not assume every example environment URL reflects these configured ports.

Use package scripts rather than invoking underlying tools when a suitable script exists. Common
targeted commands include:

```sh
pnpm --filter @versetools/web check
pnpm --filter @versetools/web build
pnpm --filter @versetools/convex check
pnpm --filter @versetools/docs build
pnpm --filter @versetools/ui package
pnpm --filter @versetools/ui-consent check
pnpm --filter @versetools/ui-consent build
pnpm --filter @versetools/sc-data-extractor build
cargo test --manifest-path apps/sc-data-extractor/Cargo.toml
```

`pnpm -r build` builds workspace packages that define a `build` script. There is no root
`pnpm build` script.

## Validation

For normal TypeScript/Svelte changes, run both focused validation and repository-level checks when
feasible:

1. Run the affected package's `check`, `lint`, `build`, or `package` scripts as appropriate.
2. Run `pnpm check`.
3. Run `pnpm lint`.

Examples:

- Web: `pnpm --filter @versetools/web check`, `pnpm --filter @versetools/web lint`, and
  `pnpm --filter @versetools/web build`.
- Convex: `pnpm --filter @versetools/convex check` and
  `pnpm --filter @versetools/convex lint`.
- UI: `pnpm --filter @versetools/ui package`.
- UI consent: `pnpm --filter @versetools/ui-consent check` and
  `pnpm --filter @versetools/ui-consent build`.
- Docs: `pnpm --filter @versetools/docs build`.
- Native extractor: `pnpm --filter @versetools/sc-data-extractor lint`,
  `pnpm --filter @versetools/sc-data-extractor build`, and
  `cargo test --manifest-path apps/sc-data-extractor/Cargo.toml`.

Important coverage limits:

- Use Vitest for TypeScript unit tests; do not add tests using Node's built-in test framework.
- Test Convex functions with `convex-test` and Vitest in the Convex edge-runtime environment. Use the
  real schema and module graph, then add focused integration coverage for function behavior.
- `convex-test` does not enforce production function limits; manually validate large imports and
  limit-sensitive operations against a local or controlled Convex backend when feasible.
- Root recursive checks only run scripts that each package defines; they do not cover every
  workspace, Rust, or `.pulumi`.
- `apps/docs`, `apps/sc-data-ingester`, and `packages/convex-client` have limited or no dedicated
  check/lint scripts.
- `pnpm format` and `pnpm lint-fix` mutate files. Review their output and do not use them to hide
  unrelated failures.
- If a relevant command cannot run because of credentials, services, native prerequisites, or an
  existing repository failure, report the exact command and failure rather than claiming success.

When Trivy is installed, the local equivalent of the CI security scan is:

```sh
trivy fs --config trivy.yaml .
```

## OpenSpec Workflow

Use OpenSpec for substantial work: new features, architectural changes, cross-cutting behavior,
schema or API redesigns, and other changes that benefit from an agreed proposal. Routine bug fixes,
small refactors, documentation updates, and narrowly scoped maintenance do not require OpenSpec
unless the user requests it.

For substantial work:

1. Inspect `openspec/config.yaml` and existing artifacts.
2. Create or continue the appropriate OpenSpec proposal, design, specs, and task list using the
   repository's OpenSpec skills.
3. Obtain any required decisions before implementing ambiguous behavior.
4. Keep implementation and artifacts aligned as the work evolves.
5. Archive the change only after implementation and verification are complete.

Do not create speculative OpenSpec artifacts for a routine task merely because the tooling exists.

## Change-Specific Guidance

### Convex

- Update schema, validators, handlers, and shared types together when changing persisted data.
- Preserve public versus internal function boundaries.
- Use the existing command/router/service and dependency-injection structure for related features.
- Define Convex routes with the project `ConvexRouter`; do not add standalone `query`, `mutation`, or
  `action` registrations for domain behavior. Keep routes in their owning domain module, rather than creating one-off route files.
- Keep raw database reads and writes in command objects. Routes should declare dependencies and use the
  runner service to invoke query or mutation commands instead of directly calling `ctx.db`, except where
  an established route pattern requires direct access.
- Regenerate Convex API files through the Convex CLI; never patch `_generated` files.
- Consider web consumers whenever generated API types or function signatures change.
- Convex indexes do not enforce uniqueness. When an invariant requires zero or one matching document, use
  `.unique()` rather than `.first()` or `.collect()` so duplicate data fails explicitly.
- Design every Convex function within the documented limits at
  https://docs.convex.dev/production/state/limits. In particular, account for 16 MiB function
  arguments and transaction reads/writes, one second of query/mutation user-code execution,
  16,000 document writes, 4,096 index ranges, 1,000 concurrent I/O operations, and 256 log lines
  per function. Batch or stage large imports, fan-out work, closure-table updates, and high-volume
  logging; do not assume a complete dataset fits in one mutation.

### Svelte And UI

- Reuse `packages/ui` before adding app-local primitives.
- Keep reusable, product-neutral components in `packages/ui`; keep consent-specific components in
  `packages/ui-consent`; keep app-specific compositions in `apps/web`.
- Preserve accessibility, keyboard behavior, responsive layouts, and server/client boundaries.
- Validate publishable packages with their package/build scripts after changing exports or props.

### Data Extraction

- Treat `apps/sc-data-extractor` plus `apps/sc-data-ingester` as canonical.
- Keep binary parsing and native Star Citizen access in the Rust extractor; keep orchestration and
  eventual application ingestion in the TypeScript ingester.
- Data-processing commands may require a local Star Citizen installation and can be expensive; do
  not run ingestion as a routine validation step.

### Infrastructure

- Treat `.pulumi` as the authoritative deployment source.
- Keep infrastructure changes narrowly scoped and inspect stack/environment dependencies first.
- Prefer preview or static validation over deployment, but only use commands established for the
  current environment or explicitly approved by the user.
- Never deploy, destroy, rotate credentials, or modify live cloud resources without explicit
  authorization.

## Completion Checklist

Before reporting a task complete:

- Re-read the diff for accidental edits, generated files, secrets, and unrelated changes.
- Confirm architecture and public exports remain coherent.
- Run targeted validation for every affected workspace.
- Run `pnpm check` and `pnpm lint` when feasible for TypeScript/Svelte changes.
- Run Rust tests for extractor logic changes.
- State which commands passed, which were not run, and why.
- Mention migrations, code generation, environment updates, or deployment follow-up when applicable.
