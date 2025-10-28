# Stack: Next.js + Supabase (noVNC)

Opinionated template for running Next.js with Supabase tooling and a lightweight noVNC desktop.

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
2. Set options via the template UI or `devcontainer-template.json`:
   - `guiProvider`: default `novnc`, switch to `webtop` for a full desktop.
   - `chromeCdpPort`: forward Chrome CDP for browser automation.
   - `supabaseLocal`: keep `true` to manage Supabase locally through the CLI helper.
   - `redis`: disable to omit the Redis sidecar and port.
3. Start the container. Check the post-start hook output for Supabase CLI guidance.

## Reproducibility

Pin your runtime by committing a `stack.lock.json` with image digests (dev, GUI, Redis) and feature versions.
