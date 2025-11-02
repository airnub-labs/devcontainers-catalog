# Classroom — Chrome CDP (Headless)

Headless Chrome (Browserless) exposed over the Chrome DevTools Protocol for automated testing and capture workflows.

## Services

- `devcontainer` — Catalog base image for workspace operations.
- `chrome-cdp` — Browserless Chrome with port `${CHROME_CDP_PORT:-3001}` forwarded to host `3000` inside the container.

## Usage

Materialize the `.template/.devcontainer/` folder into your repo and run `docker compose` with both the workspace compose and the Chrome CDP fragment. The `CHROME_CDP_URL` environment variable is injected for convenience so headless tooling can attach automatically.

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Set `spec.base_preset: node-pnpm` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Prebuilt workspace keeps Chrome CDP and Node tooling ready for Codespaces test runners. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/classroom-chrome-cdp:1.0.0 --workspace-folder .` | Apply template locally when you want to modify features or Compose fragments before sharing. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template locally with `devcontainer templates apply …` per [Quick modes](#quick-modes) › Flexible (Feature). | Generate the manifest-driven scaffold with `npx @airnub/devc generate …` following [Quick modes](#quick-modes) › Fast (Prebuilt). | `spec.base_preset: node-pnpm` publishes a cached image so Chrome CDP tooling lands ready for automation. | Pin the preset tag when requesting Codespaces prebuilds so Chrome launches without re-install overhead. |
| Ports | Forward `${CHROME_CDP_PORT:-3001}` to host `3000` as shown in the [Services](#services) section. | Same mapping; Codespaces surfaces the labelled Chrome DevTools port automatically. | Port metadata is bundled with the template so prebuilt images don’t need extra configuration. | Keep the port private in Codespaces when exposing automation endpoints beyond the classroom. |
| Sidecars | `chrome-cdp` service runs alongside the workspace; compose up locally for parity. | Same compose fragment runs in Codespaces via the generated `.devcontainer/compose.yaml`. | Sidecar definition ships with the template—prebuild just warms the workspace image. | Codespaces health checks wait for `/json/version`; monitor notifications before starting test suites. |
| Minimum resources | Verified on Docker Desktop with 2 CPUs / 4 GB; increase if parallel Chrome sessions are required. | Runs on 2-core / 4 GB Codespaces. | Prebuilt preset prevents npm installs from spiking CPU on first launch. | Consider bumping to 4-core Codespaces for CI-like workloads hitting the CDP service continuously. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.cdpPort}}` is labelled so Codespaces forwards Chrome CDP with context; default host mapping is stable for local Docker.
- **Health** — Compose fragment exposes a health check hitting `/json/version` to ensure headless Chrome is ready before tests run.
- **Secrets** — Template doesn’t ship `.env.example`; manifests can add placeholders for API keys so `.devcontainer/.env.example` is generated.
- **Resources** — Verified on 2-core / 4 GB Codespaces and local Docker Desktop with CPU limit 2; adjust manifest resources for large automation suites.
- **Aggregate compose** — Additional services (Supabase, Redis) join the same `devnet` network when added with `devc add service`.
