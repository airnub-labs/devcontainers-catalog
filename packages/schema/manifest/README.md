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
* Support window: the two latest **MAJOR** versions receive validation updates; older majors may be deprecated in `CHANGELOG.md`.

### Compatibility Matrix

| Package | `schemaVersion` | Status  |
| ------: | --------------- | ------- |
|     1.x | 1.x             | Current |

## Changelog

See `CHANGELOG.md`.

## License

MIT

