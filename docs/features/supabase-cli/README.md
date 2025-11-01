# Supabase CLI feature maintenance

The catalog pins the Supabase CLI to **v1.188.0** by default. Keep the pin fresh so new projects inherit current Supabase tooling without contacting the GitHub API at build time.

## Refreshing the version pin
1. Check the upstream release feed (for example with `gh release list --repo supabase/cli --limit 1`).
2. Update `devcontainer-feature.json` and the option tables in `features/supabase-cli/README.md` to the new tag (always include the leading `v`).
3. Regenerate any cached artifacts (see below) and commit them to your internal artifact store.
4. Run the feature tests locally (`pnpm test --filter supabase-cli` if available) before opening a PR.

## Preparing offline cache assets
When `offline=true` the installer expects to find the `.deb` payload and a checksum file inside the configured `cacheDir`.

```bash
VERSION="1.188.0"
ARCH="amd64" # or arm64
CACHE_DIR="/tmp/feature-cache/supabase-cli"
mkdir -p "$CACHE_DIR"

base="supabase_${VERSION#v}_linux_${ARCH}.deb"
curl -fsSLo "$CACHE_DIR/$base" "https://github.com/supabase/cli/releases/download/v$VERSION/$base"

curl -fsSLo "$CACHE_DIR/supabase_${VERSION#v}_SHA256SUMS" \
  "https://github.com/supabase/cli/releases/download/v$VERSION/supabase_${VERSION#v}_SHA256SUMS"
```

Place the resulting directory on the devcontainer host and point the feature’s `cacheDir` option at it when building offline.
