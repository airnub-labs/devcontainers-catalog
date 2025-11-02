# Workspace Manifest Contract

The devcontainers catalog emits a `manifest.json` alongside every generated workspace. The file follows the schema published by `@airnub/devcontainers-catalog-manifest` and is designed to be consumed by downstream platforms without any catalog-specific assumptions.

## Fields

- `schemaVersion` — semantic version of the manifest contract.
- `stackId` — stack template identifier (e.g. `nextjs-supabase@1.0.0`).
- `catalogCommit` — git SHA of the catalog commit that produced the workspace.
- `browsers` — GUI/browser sidecars enabled during generation.
- `ports` — list of forwarded ports and their recommended visibility defaults.
- `env` — required environment variable **names** (never values).
- `paths` — key files/directories the platform can surface (`.devcontainer`, README, `/classroom-browser`).
- `notes` — optional hints for adapters (UDP preference, fallback modes, additional guidance).

Consumers should import the TypeScript helpers exported by `@airnub/devcontainers-catalog-manifest` to validate manifests at build time. The raw schema is also published for JSON Schema tooling.
