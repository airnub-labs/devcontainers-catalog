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
| `version` | string | `"latest"` | Semver or tag for the Deno release to install. |
| `installCompletions` | boolean | `true` | Install shell completions under `/etc/bash_completion.d`, `/usr/share/zsh/site-functions`, and `/usr/share/fish/vendor_completions.d`. |

The feature is idempotent: if the requested version is already on the `PATH`, the installer exits early. Archives are fetched from `https://dl.deno.land/release/<tag>/` and unpacked into `/usr/local/bin`.

<!-- Trigger feature test workflow. -->
