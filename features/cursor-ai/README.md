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
| `version` | string | `"0.3.3"` | npm tag or semver for `@cursorai/cli`. |
| `cacheDir` | string | `""` | Directory containing cached `@cursorai/cli` tarballs (output of `npm pack`). |
| `offline` | boolean | `false` | Disables network fetches; requires `cacheDir` tarballs. |

The installer skips reinstallation if the Cursor CLI is already available on the `PATH` and the requested version matches the recorded state (or when `version` remains pinned). Ensure that either `pnpm` or `npm` is present in the container; the feature exits with an error otherwise.

When `offline` is true the installer first checks `cacheDir` for a tarball named `cursorai-cli-<version>.tgz`. Provide the tarball ahead of time with `npm pack @cursorai/cli@<version>` (or via your artifact mirror); otherwise the feature aborts instead of requesting the registry.

After installation, the `cursor` binary is accessible globally, making it suitable for wiring into template-level MCP workflows or automation scripts.

<!-- Trigger feature test workflow. -->
