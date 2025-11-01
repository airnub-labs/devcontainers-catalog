# Deno Feature

Installs the [Deno runtime](https://deno.land/) from the official release archives. Supports pinning to a specific version and optionally wiring shell completions for Bash, Zsh, and Fish.

## Usage

```jsonc
"features": {
  "ghcr.io/airnub-labs/devcontainer-features/deno:1": {
    "version": "1.44.4"
  }
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `version` | string | `"2.0.0"` | Semver or tag for the Deno release to install. |
| `installCompletions` | boolean | `true` | Install shell completions under `/etc/bash_completion.d`, `/usr/share/zsh/site-functions`, and `/usr/share/fish/vendor_completions.d`. |
| `cacheDir` | string | `""` | Directory containing cached `deno-<target>.zip` and `SHA256SUMS` assets. |
| `offline` | boolean | `false` | Skip network fetches. Requires `cacheDir` artifacts and a pre-installed `unzip` binary. |

The feature is idempotent: if the requested version is already on the `PATH`, the installer exits early. Archives are fetched from `https://dl.deno.land/release/<tag>/` and unpacked into `/usr/local/bin`.

When `offline` is true the installer only reads from `cacheDir`. Ensure the directory includes `deno-${TARGET}.zip` (where `${TARGET}` resolves to `x86_64-unknown-linux-gnu` or `aarch64-unknown-linux-gnu`) and the matching `SHA256SUMS` file.

<!-- Trigger feature test workflow. -->
