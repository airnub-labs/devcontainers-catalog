# Stack: Web + Node + Supabase (Webtop)

Starter stack for Node.js web apps with Supabase integration and a full desktop via Webtop, built on the `ghcr.io/airnub-labs/devcontainer-images/dev-web` image.

## Services & Ports

| Service | Purpose | Port(s) |
| --- | --- | --- |
| `dev` | Node.js development container | 3000 (app), {{templateOption.chromeCdpPort}} (CDP) |
| `{{templateOption.guiProvider}}` | GUI sidecar (`webtop` → 3001, `novnc` → 6080) | 3001 / 6080 |
| `redis` (optional) | Cache/queue sidecar | 6379 |

## Features

- `supabase-cli` (local Supabase workflows)
- `chrome-cdp` (browser automation/debugging)
- `agent-tooling-clis` (optional automation helpers)

## Using this template

1. Copy `.template/.devcontainer/*` or reference this template when creating a Codespace.
2. Configure template options as needed:
   - `guiProvider`: Webtop by default for a full desktop; switch to `novnc` if you prefer a minimal viewer.
   - `chromeCdpPort`: expose the Chrome debugging endpoint.
   - `supabaseLocal`: keep `true` to rely on the CLI-managed Supabase flow.
   - `redis`: disable when the project does not require Redis.
3. Run `supabase start` from the terminal after the container initializes to provision local services.

## Reproducibility

Track digests for the dev image, GUI, and Redis sidecars plus feature versions in a `stack.lock.json` for deterministic rebuilds.
