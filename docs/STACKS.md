# Stacks (Template Flavors)

- `stack-nextjs-supabase-webtop`
- `stack-nextjs-supabase-novnc`
- `stack-web-node-supabase-webtop`

## Options to standardize
- `guiProvider`: `webtop` | `novnc`
- `chromeCdpPort`: default 9222
- `supabaseLocal`: `true|false` (CLI-managed)
- `redis`: `true|false` (default true)

Ensure each stack template folder has:

- `devcontainer-template.json` with options above
- `.template/.devcontainer/` payload (compose, devcontainer.json, hooks)
- `README.md` explaining ports, services, features, and how to materialize
- Optional `stack.lock.json` with pinned versions
