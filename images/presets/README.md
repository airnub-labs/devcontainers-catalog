# Preset Images

Prebuildable `devcontainer.json` presets that lean on Features instead of baking runtimes directly into the base image. Build them with the Dev Containers CLI and publish fast-start images to GHCR.

## Available presets

- `node-pnpm`: Adds Node.js 24 via the official Feature, enables pnpm (with a shared volume-backed store), and installs common web extensions.
- `python`: Installs Python 3.12 and JupyterLab via the Python Feature with matching VS Code extensions.
- `full`: Combines the Node + pnpm and Python Features for full-stack work.
- `python-prefect`: Adds Prefect orchestration tooling and pins ports/health checks for classroom demos.
- `python-airflow`: Packages Airflow SequentialExecutor + UI defaults with health checks and env placeholders.
- `python-dagster`: Ships Dagster dev server wiring with workspace mounts ready for generated lessons.
- `ts-temporal`: Bundles the Temporal TypeScript SDK environment for worker development against the `temporal` service fragment.

## Prebuilding locally

Use the Dev Containers CLI to build (and optionally push) an image. Update the workspace folder path to match the preset you want to package.

```bash
# Example: publish the full preset as an image
devcontainer build \
   --workspace-folder images/presets/full \
   --image-name ghcr.io/airnub-labs/templates/full:ubuntu-24.04 \
   --push
```

### GitHub Actions example

```yaml
name: publish-preset-images

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - "images/presets/**"

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: devcontainers/ci@v0.3
        with:
          runCmd: |
            devcontainer build \
              --workspace-folder images/presets/full \
              --image-name ghcr.io/airnub-labs/templates/full:ubuntu-24.04 \
              --push
```

Refer to the root `Makefile` (or craft a similar script) for repeatable local builds across presets.
