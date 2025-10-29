# Template Images

Opinionated devcontainer.json presets that lean on Features instead of baking runtimes into the base image.

## Available presets

- `node-pnpm`: Adds Node.js 24 via the official Feature, enables pnpm (with a shared volume-backed store), and installs common web extensions.
- `python`: Installs Python 3.12 and JupyterLab via the Python Feature with matching VS Code extensions.
- `full`: Combines the Node + pnpm and Python Features for full-stack work.

## Prebuilding

You can prebuild and publish any of these templates to GHCR, keeping the configuration the same while offering faster start times:

```bash
# Example: publish the full template as an image
devcontainer build \
  --workspace-folder images/templates/full \
  --image-name ghcr.io/airnub-labs/templates/full:ubuntu-24.04
```
