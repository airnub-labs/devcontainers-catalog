# Coding Agent Prompt — Scaffold `@airnub/devcontainers-catalog-manifest` (Package, SemVer Policy, README)

> **Objective**: In the `airnub-labs/devcontainers-catalog` repo, scaffold a **publishable, education-agnostic** schema/types package named **`@airnub/devcontainers-catalog-manifest`**. This package ships the **JSON Schema** for the catalog’s manifest, **TypeScript types** generated from that schema, a tiny **validate** helper, a clear **SemVer policy tied to `schemaVersion`**, and a short **README** the agent will drop into the package.
>
> This package is consumed by **`comhra-core-platform`** (and any other platform) to validate and type-check generated `manifest.json` files at build/runtime.

---

## Repos & Scope

* **Repository:** `airnub-labs/devcontainers-catalog`
* **Target Package Path:** `packages/schema/manifest` (create if not present)
* **Package Name:** `@airnub/devcontainers-catalog-manifest`

Out of scope: any education SaaS persistence or provider logic. This package must remain **stateless and agnostic**.

---

## Deliverables (Create/Modify Files)

### 1) JSON Schema & Types

* `packages/schema/manifest/schema/manifest.schema.json`

  * JSON Schema **v2020-12** (or later) describing the manifest (fields listed below).
* `packages/schema/manifest/src/types.ts`

  * **Generated** TypeScript types from the schema (see Build scripts).
* `packages/schema/manifest/src/index.ts`

  * Exports: `schema` (as JSON), `Manifest` TS type, `validateManifest()` runtime validator.

### 2) Package Scaffolding

* `packages/schema/manifest/package.json`

  * name: `@airnub/devcontainers-catalog-manifest`
  * type: `module`
  * main: `dist/index.js`
  * types: `dist/types.d.ts`
  * files: `dist/`, `schema/`, `README.md`, `LICENSE` (no test fixtures in publish)
  * scripts: `build`, `clean`, `typegen`, `lint`, `test`, `pack:check`
* `packages/schema/manifest/tsconfig.json`
* `packages/schema/manifest/.npmignore` (or rely on `files` in package.json)
* `packages/schema/manifest/README.md` (**see content stub below**)
* `packages/schema/manifest/CHANGELOG.md` (initialized; actual entries via release tooling)
* `LICENSE` (MIT) — ensure root license is referenced; include a copy if package publishing requires it.

### 3) Build & Tooling

* Use one of:

  * **`json-schema-to-typescript`** (preferred) to generate `src/types.ts` from `schema/manifest.schema.json`, or
  * **`typescript-json-schema`** if starting from TS → schema (less ideal here).
* Use **`ajv`** (v8+) for runtime validation in `validateManifest()`.
* Add **npm scripts** to:

  * `typegen`: generate TS types from schema.
  * `build`: run `typegen`, compile TS to `dist`, copy `schema/` to `dist/schema`.
  * `pack:check`: `npm pack --dry-run` (ensure only intended files publish).

### 4) CI (lightweight)

* Ensure repo’s root CI runs `npm -w packages/schema/manifest run build`.
* Add a matrix job (Node LTS) that runs `typegen` + `build` + a tiny `validate` test on a sample manifest fixture.

---

## Manifest Schema — Required Fields (v1)

Implement the schema to capture exactly the **shape** (no secrets or provider data):

* `schemaVersion`: string, SemVer (e.g., `1.0.0`).
* `stackId`: string (e.g., `nextjs-supabase@1.0.0`).
* `catalogCommit`: string (git SHA).
* `browsers`: array of strings (`neko-chrome`, `neko-firefox`, `kasm-chrome`).
* `ports`: array of objects

  * `port`: integer (1–65535)
  * `label`: string (human-friendly, suitable for Codespaces labels)
  * `purpose`: string (short, e.g., `neko-ui`, `kasm-ui`, `tcp-mux`, `app`)
  * `recommendedPrivacy`: enum `PRIVATE | COURSE | PUBLIC`
* `env`: array of objects

  * `name`: string (env **names only**, e.g., `NEKO_USER_PASSWORD`)
  * `description?`: string
  * `required?`: boolean (default false)
* `paths`: object

  * `devcontainer`: string (path to devcontainer.json)
  * `compose?`: string (path to docker-compose, if any)
  * `readme`: string
  * `classroomBrowser?`: string
* `notes?`: object

  * `prefersUDP?`: boolean
  * `codespacesFallback?`: enum `tcp-mux | https-ws`
  * `other?`: string

Add `$defs` as needed for reusability; mark optional properties explicitly.

---

## SemVer & Versioning Policy (Tie package version ↔ `schemaVersion`)

**Rule 1 — Major = Breaking schema:**

* Any change that **invalidates previously valid manifests** or **renames/removes fields** → **MAJOR** bump (e.g., 1.x → 2.0.0). Update `schemaVersion` default accordingly.

**Rule 2 — Minor = Backward-compatible additions:**

* Add **optional** fields, extend enums with **non-breaking** values, add new `$defs` → **MINOR** bump (e.g., 1.2.0 → 1.3.0).

**Rule 3 — Patch = Non-functional fixes:**

* Description/docstring clarifications, typo fixes, stricter constraints that **do not** reject previously valid manifests, build infra tweaks → **PATCH**.

**Rule 4 — Version mirroring:**

* The **npm package version** MUST mirror the schema’s **`schemaVersion`** (keep them equal). Consumers can lock on `^MAJOR.MINOR` as needed.

**Rule 5 — Support window:**

* Maintain validation support for **two latest MAJOR** versions. Document deprecations in `CHANGELOG.md` and README **Compatibility Matrix**.

**Rule 6 — Change communication:**

* For a MAJOR bump, include a **Migration** section in README noting field renames/removals.

---

## README Stub (drop this content into `packages/schema/manifest/README.md`)

````md
# @airnub/devcontainers-catalog-manifest

Portable **JSON Schema** + **TypeScript types** for the `manifest.json` emitted by the _devcontainers-catalog_ generator. Use it to **validate** and **type-check** catalog outputs in any consumer (e.g., comhrá Edu SaaS).

## Install

```bash
npm i @airnub/devcontainers-catalog-manifest ajv
```

## What’s Included

* `schema/manifest.schema.json` — JSON Schema (v2020-12)
* `dist/types.d.ts` — TypeScript types generated from the schema
* `dist/index.js` — exports `schema`, `Manifest` type, and `validateManifest()` helper

## Quickstart

```ts
import { schema, validateManifest, type Manifest } from '@airnub/devcontainers-catalog-manifest';

// at runtime
const { valid, errors } = validateManifest(manifestJson);
if (!valid) throw new Error(JSON.stringify(errors));

// at compile-time
const manifest: Manifest = manifestJson; // typed
```

## Versioning & Compatibility

* Package **version mirrors** `schemaVersion` in the schema.
* **MAJOR**: breaking changes (fields removed/renamed, previously valid now invalid).
* **MINOR**: backward-compatible additions (optional fields, non-breaking enums).
* **PATCH**: docs/typo/infra tweaks; no shape changes.

### Compatibility Matrix

| Package | `schemaVersion` | Status  |
| ------: | --------------- | ------- |
|     1.x | 1.x             | Current |

## Changelog

See `CHANGELOG.md`.

## License

MIT

```

---

## Tasks (Step-by-Step)
1) Create package directory `packages/schema/manifest/` and scaffold files listed above.
2) Implement `manifest.schema.json` with fields and constraints described.
3) Add `typegen` script using `json-schema-to-typescript` to generate `src/types.ts`.
4) Implement `src/index.ts`:
   - export `schema` (import JSON)
   - export `Manifest` type
   - implement `validateManifest()` using `ajv`
5) Wire `build` to run `typegen`, compile TS to `dist`, and copy `schema/`.
6) Add minimal tests with sample valid/invalid manifests.
7) Update root CI to build this workspace; ensure `npm pack --dry-run` includes only intended files.
8) Document the **SemVer policy** in the README and ensure package version == `schemaVersion`.
9) Prepare for publish (no actual publish in this PR unless instructed): ensure `access: public` for scoped package, set repository info, keywords, license.

---

## Acceptance Criteria
- Package `@airnub/devcontainers-catalog-manifest` builds locally and in CI.
- `manifest.schema.json` validates sample manifests; `validateManifest()` returns `{ valid, errors }`.
- `types.ts` is generated from the schema and re-exported as `Manifest`.
- README contains Install/Quickstart/Versioning/Matrix/License sections (as stub provided).
- SemVer policy documented; package version equals `schemaVersion` in the schema.
- No DB, secrets, or education-specific logic introduced.
- `npm pack --dry-run` shows only `dist/`, `schema/`, `README.md`, `LICENSE`, and `package.json`.

---

## Notes & Constraints
- Keep schema **strict** but avoid breaking existing known manifests for v1.
- Do not add provider specifics (Codespaces/DevPod) to this package; it describes **catalog output only**.
- Keep the package **MIT** and small; no heavy deps beyond `ajv` and schema-to-types tooling.

``````
