# Stack: Next.js + Supabase (Webtop)

Opinionated template that layers Supabase tooling, Redis, and a browser-accessible desktop over the base `ghcr.io/airnub-labs/devcontainer-images/dev-web` image.

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
    "dev": "ghcr.io/airnub-labs/devcontainer-images/dev-web@sha256:<digest>",
    "webtop": "lscr.io/linuxserver/webtop@sha256:<digest>"
  },
  "features": {
    "supabase-cli": "ghcr.io/airnub-labs/devcontainer-features/supabase-cli:1",
    "chrome-cdp": "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1"
  }
}
```

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Configure `spec.base_preset: node-pnpm` in your lesson manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Gives learners a prebuilt Next.js + Supabase desktop with Redis/CDP ready to go. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-webtop:1.0.0 --workspace-folder .` | Start from source when you need to tweak GUI providers or Compose wiring. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template locally via [Quick modes](#quick-modes) › Flexible (Feature) to customise GUI/Redis options. | Use the manifest-driven [Quick modes](#quick-modes) › Fast (Prebuilt) to boot Codespaces with the same stack. | `spec.base_preset: node-pnpm` prebuilds the workspace while GUI/Redis sidecars run at runtime. | Pin preset digests to keep Codespaces prebuilds aligned with your local tests. |
| Ports | App (3000), GUI (3001/6080), and CDP (`{{templateOption.chromeCdpPort}}`) align with the [Services & Ports](#services--ports) table. | Codespaces forwards the same labelled ports automatically. | Port metadata lives in the template, so prebuilds inherit it without extra steps. | Keep GUI ports private until you intentionally share the desktop. |
| Sidecars | GUI and optional Redis sidecars compose locally using the template options. | Same sidecars launch in Codespaces using the generated compose overrides. | Sidecar images pull at runtime leaving the prebuilt workspace lean. | Watch Codespaces health messages to confirm Webtop/noVNC readiness before demos. |
| Minimum resources | Allocate 4 CPUs / 8 GB locally when running the full stack. | Select at least a 4-core / 8 GB Codespace for equivalent performance. | Cached preset avoids pnpm installs from delaying desktop availability. | Increase Codespaces resources if Supabase migrations and GUI usage saturate CPU. |

## Local ↔ Codespaces parity checklist

- **Ports** — App (3000), GUI (3001/6080), and CDP (`{{templateOption.chromeCdpPort}}`) labelled to mirror Codespaces & local dev.
- **Health** — Redis and GUI fragments include health checks; aggregate compose waits so Next.js boot logs aren’t lost.
- **Secrets** — Generated presets surface Supabase keys in `.env.example`; commit docs remind instructors to hydrate Codespaces secrets.
- **Resources** — 4-core / 8 GB works well; disable Redis or agent tooling for smaller SKUs.
- **Aggregate compose** — Additional catalog services (Temporal, Prefect) keep using `devnet` for consistent URLs across environments.
