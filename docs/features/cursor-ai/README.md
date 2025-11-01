# Cursor CLI feature maintenance

The catalog pins `@cursorai/cli` to **0.3.3** by default.

## Refreshing the version pin
1. View the package metadata (`npm view @cursorai/cli version`) or inspect the vendor changelog.
2. Update `devcontainer-feature.json` and the option table in `features/cursor-ai/README.md` to the new version string.
3. Adjust the cache instructions below and re-test the feature before submitting a pull request.

## Preparing offline cache assets
Offline mode installs from a pre-packed tarball. Use `npm pack` to mirror the package into your artifact store.

```bash
VERSION="0.3.3"
CACHE_DIR="/tmp/feature-cache/cursor-ai"
mkdir -p "$CACHE_DIR"

tmpdir="$(mktemp -d)"
(cd "$tmpdir" && npm pack @cursorai/cli@"$VERSION" --silent)
find "$tmpdir" -maxdepth 1 -name "cursorai-cli-$VERSION.tgz" -exec mv {} "$CACHE_DIR"/ \;
rm -rf "$tmpdir"
```

Mount the cache directory into the devcontainer host and set the feature’s `cacheDir` option to point at it when running offline.
