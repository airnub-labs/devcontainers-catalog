# Classroom — Webtop (Desktop via Browser)

This template pairs the standard catalog devcontainer image with the `linuxserver/webtop` sidecar so students can access a full desktop over the browser.

> **Usage terms:** Review [docs/sidecars.md#linuxserver-webtop](../../docs/sidecars.md#linuxserver-webtop) before sharing this sidecar with students.

## Services

- `devcontainer` — Codespaces-compatible workspace container using the catalog base image.
- `webtop` — Desktop sidecar exposed on `${WEBTOP_HTTP_PORT:-3000}`.

## Usage

Copy the `.template/.devcontainer/` folder into your repository or apply this template via `devcontainer templates apply`. Bring the stack online with `docker compose -f .devcontainer/docker-compose.yml -f services/webtop/docker-compose.webtop.yml up -d webtop` or use the catalog `stack-up` target with `WEBTOP=1`.

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Pin `spec.base_preset: full` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Prebuilt image gives instant desktop + CLI parity on Codespaces and local machines. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/classroom-webtop:1.0.0 --workspace-folder .` | Use when you need to edit Compose overrides or mount extra assets before sharing. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.webtopPort}}` labeled “Classroom Webtop” keeps Codespaces port UI consistent with local Docker.
- **Health** — Webtop fragment includes a health check so dependent services wait until the desktop is ready.
- **Secrets** — Add `spec.secrets_placeholders` to manifests; generated presets emit `.env.example` so instructors can note managed credentials.
- **Resources** — Tested on 4-core / 8 GB Codespaces; adjust resolution env vars for low-power Chromebooks.
- **Aggregate compose** — Additional services join `devnet`, letting Supabase/Redis share credentials across local and hosted environments.
