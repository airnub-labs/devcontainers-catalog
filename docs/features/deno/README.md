# Deno feature maintenance

The catalog defaults to **Deno 2.0.0**. Update the pin periodically to keep parity with upstream tooling while avoiding automatic API calls during installs.

## Refreshing the version pin
1. Inspect the latest tag (`gh release list --repo denoland/deno --limit 1` or https://github.com/denoland/deno/releases).
2. Update `devcontainer-feature.json`, the option table in `features/deno/README.md`, and the cache instructions below to the new version.
3. Run the feature tests locally (`pnpm test --filter deno`) if available.

## Preparing offline cache assets
Offline installs expect `cacheDir` to contain the release archive and checksum file that matches the requested architecture.

```bash
VERSION="2.0.0"
TARGET="x86_64-unknown-linux-gnu" # or aarch64-unknown-linux-gnu
CACHE_DIR="/tmp/feature-cache/deno"
mkdir -p "$CACHE_DIR"

curl -fsSLo "$CACHE_DIR/deno-$TARGET.zip" \
  "https://dl.deno.land/release/v$VERSION/deno-$TARGET.zip"

curl -fsSLo "$CACHE_DIR/SHA256SUMS" \
  "https://dl.deno.land/release/v$VERSION/SHA256SUMS"
```

Copy the populated directory to the devcontainer host and set the feature’s `cacheDir` to that path. Remember to include `unzip` in the base image when running offline.
