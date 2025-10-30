# Stack: Next.js + Supabase (noVNC)

Opinionated template for running Next.js with Supabase tooling and a lightweight noVNC desktop on top of the `ghcr.io/airnub-labs/devcontainer-images/dev-web` image.

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

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Use `spec.base_preset: node-pnpm` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Students land on a prebuilt Next.js + Supabase image with GUI fragments already merged. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-novnc:1.0.0 --workspace-folder .` | Copy when you want to toggle Redis, Supabase CLI mode, or GUI provider before sharing. |

## Local ↔ Codespaces parity checklist

- **Ports** — App (3000), GUI (3001/6080), and CDP (`{{templateOption.chromeCdpPort}}`) are labelled so Codespaces matches local Docker.
- **Health** — Supabase CLI post-start plus Redis health ensures `aggregate.compose.yml` waits on services before traffic arrives.
- **Secrets** — `.env.example` from generated presets lists Supabase keys; commit instructions remind instructors to set Codespaces secrets.
- **Resources** — Works on 4-core / 8 GB Codespaces. For low-power devices disable Redis or pick `webtop` only when needed.
- **Aggregate compose** — Additional services (Temporal, Prefect) plug into the same network with `devc add service <name>`.
