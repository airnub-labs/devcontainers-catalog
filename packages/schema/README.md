# @airnub/devcontainers-catalog-manifest

This package distributes the JSON schema and TypeScript utilities for workspace manifests emitted by the AirNub devcontainers catalog generator.

## Usage

```bash
npm install @airnub/devcontainers-catalog-manifest
```

```ts
import { validateManifest, WorkspaceManifest } from '@airnub/devcontainers-catalog-manifest';

const manifest: WorkspaceManifest = loadFromSomewhere();
validateManifest(manifest);
```

The published package also exposes the raw schema at `@airnub/devcontainers-catalog-manifest/manifest.schema.json` for build-time validation.
