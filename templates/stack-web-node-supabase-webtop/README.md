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

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Use `spec.base_preset: node-pnpm` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Prebuilt Node stack gives instant Supabase + desktop parity for Codespaces classes. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/stack-web-node-supabase-webtop:1.0.0 --workspace-folder .` | Ideal when you want to toggle Redis, GUI provider, or CLI bundles before publishing. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template locally via [Quick modes](#quick-modes) › Flexible (Feature) to customise GUI/Redis options. | Use the manifest-driven [Quick modes](#quick-modes) › Fast (Prebuilt) to provision Codespaces with the same stack. | `spec.base_preset: node-pnpm` prebuilds the workspace; sidecars start at runtime. | Pin preset digests so Codespaces rebuilds mirror local behaviour. |
| Ports | App (3000), GUI (3001/6080), and CDP (`{{templateOption.chromeCdpPort}}`) match the [Services & Ports](#services--ports) table. | Codespaces forwards the same labelled ports automatically. | Port metadata lives in the template so prebuilds require no edits. | Keep GUI ports private until you intend to share them with students. |
| Sidecars | GUI and optional Redis sidecars compose locally based on template options. | Identical sidecars launch in Codespaces from the generated compose overrides. | Sidecar images pull at runtime keeping the prebuilt workspace lean. | Watch Codespaces health notifications before directing students to the desktop. |
| Minimum resources | Plan for 4 CPUs / 8 GB locally to support Node + Supabase + GUI. | Choose at least a 4-core / 8 GB Codespace for parity. | Prebuilt workspace prevents pnpm installs from delaying Supabase CLI usage. | Increase Codespaces machine size if Supabase + GUI workloads saturate CPU. |

## Local ↔ Codespaces parity checklist

- **Ports** — 3000 app, GUI (3001/6080), and CDP (`{{templateOption.chromeCdpPort}}`) labelled for consistent forwarding.
- **Health** — Redis/GUI fragments include health checks; aggregate compose waits so the Next.js dev server sees dependencies.
- **Secrets** — `.env.example` includes Supabase keys when generated via manifests; sync production secrets via Codespaces settings.
- **Resources** — Works on 4-core / 8 GB; disable agent tooling for minimal SKUs.
- **Aggregate compose** — `devc add service temporal prefect` extends the stack while keeping `devnet` networking identical on local and hosted runs.
