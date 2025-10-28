# Stack: Next.js + Supabase (Webtop)

Opinionated template that layers Supabase tooling, Redis, and a browser-accessible desktop over the base `dev-web` image.

## Services & Ports

| Service | Purpose | Port(s) |
| --- | --- | --- |
| `dev` | Next.js workspace container | 3000 (app), {{templateOption.chromeCdpPort}} (CDP) |
| `{{templateOption.guiProvider}}` | GUI sidecar (`webtop` → 3001, `novnc` → 6080) | 3001 / 6080 |
| `redis` (optional) | Caching/queue sidecar | 6379 |

## Features

- `supabase-cli` (optionally manages local stack via CLI)
- `chrome-cdp` (exposes Chrome DevTools Protocol)
- `agent-tooling-clis` (optional suite for AI workflows)

## Using this template

1. Copy `.template/.devcontainer/*` into your workspace or reference this template by ID in `devcontainer.json`.
2. Set template options in `devcontainer-template.json` or the Codespaces UI:
   - `guiProvider`: default `webtop`, switch to `novnc` for a lightweight desktop.
   - `chromeCdpPort`: forward Chrome CDP for browser automation.
   - `supabaseLocal`: keep `true` to let the CLI manage `supabase start` (see post-start hook).
   - `redis`: disable if your stack does not need Redis.
3. Launch the container. The post-start hook ensures Supabase CLI prerequisites and leaves instructions for starting the local stack.

## Reproducibility

Add a `stack.lock.json` (example below) to pin image digests and feature versions:

```json
{
  "images": {
    "dev": "ghcr.io/airnub-labs/dev-web@sha256:<digest>",
    "webtop": "lscr.io/linuxserver/webtop@sha256:<digest>"
  },
  "features": {
    "supabase-cli": "ghcr.io/airnub-labs/devcontainer-features/supabase-cli:1",
    "chrome-cdp": "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1"
  }
}
```
