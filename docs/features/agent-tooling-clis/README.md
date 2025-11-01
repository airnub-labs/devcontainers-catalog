# Agent tooling CLIs feature maintenance

The catalog currently pins:

- `@openai/codex` **0.4.0**
- `@anthropic-ai/claude-code` **0.3.2**
- `@google/gemini-cli` **0.2.1**

## Refreshing the version pins
1. Query each package (`npm view <package> version`) or consult vendor release notes.
2. Update `devcontainer-feature.json` and the option table in `features/agent-tooling-clis/README.md` with the new versions.
3. Regenerate cached tarballs (see below) for every CLI that changed.
4. Run the feature tests locally to confirm the installers still succeed with the new pins.

## Preparing offline cache assets
Use `npm pack` to prepare tarballs that match the new pins. The installer looks for `<scope>-<name>-<version>.tgz` files under the configured `cacheDir`.

```bash
CACHE_DIR="/tmp/feature-cache/agent-clis"
mkdir -p "$CACHE_DIR"

for pkg in @openai/codex@0.4.0 @anthropic-ai/claude-code@0.3.2 @google/gemini-cli@0.2.1; do
  tmp="$(mktemp -d)"
  (cd "$tmp" && npm pack "$pkg" --silent)
  mv "$tmp"/*.tgz "$CACHE_DIR"/
  rm -rf "$tmp"
done
```

Mount `CACHE_DIR` on the devcontainer host and set the feature’s `cacheDir` option accordingly when running with `offline=true`.
