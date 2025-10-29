# Cursor AI CLI Feature

Installs the [Cursor](https://cursor.sh/) command line client (`@cursorai/cli`) by using the first available Node package manager on the image (`pnpm` preferred, `npm` fallback). The feature is idempotent and records the resolved version under `/usr/local/share/devcontainer/features/cursor-ai/feature-installed.txt`.

## Usage

```jsonc
"features": {
  "ghcr.io/airnub-labs/devcontainer-features/cursor-ai:1": {}
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `version` | string | `"latest"` | npm tag or semver for `@cursorai/cli`. |

The installer skips reinstallation if the Cursor CLI is already available on the `PATH` and the requested version matches the recorded state (or when `version` remains `latest`). Ensure that either `pnpm` or `npm` is present in the container; the feature exits with an error otherwise.

After installation, the `cursor` binary is accessible globally, making it suitable for wiring into template-level MCP workflows or automation scripts.

<!-- Trigger feature test workflow. -->
