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

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template or compose the services locally per [Quick modes](#quick-modes) › Flexible (Feature). | Generate via [Quick modes](#quick-modes) › Fast (Prebuilt) so Codespaces boots with the same desktop wiring. | `spec.base_preset: full` delivers a cached workspace image while the Webtop sidecar launches at runtime. | Pin preset tags to keep Codespaces prebuilds aligned with local revisions. |
| Ports | `${WEBTOP_HTTP_PORT:-3000}` publishes the desktop; `docker compose … webtop` opens it on `http://localhost:<port>`. | Codespaces exposes the same port labelled “Classroom Webtop.” | Port configuration lives in the template, so prebuilds inherit it automatically. | Keep the port private until you’re ready to invite attendees into the desktop. |
| Sidecars | `linuxserver/webtop` sidecar powers the desktop; manage overrides via compose locally. | Same sidecar starts in Codespaces with identical health checks. | Sidecar image is fetched at runtime, leaving the prebuilt workspace lean. | Wait for the Codespaces “service ready” toast before sharing the Webtop link. |
| Minimum resources | Runs best with 4 CPUs / 8 GB locally; reduce resolution env vars if hardware is constrained. | Choose at least a 4-core / 8 GB Codespace for smooth sessions. | Prebuilding prevents post-create installs from stealing CPU needed by Webtop. | Codespaces auto-suspends idle sessions; reopen the port if the desktop sleeps. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.webtopPort}}` labeled “Classroom Webtop” keeps Codespaces port UI consistent with local Docker.
- **Health** — Webtop fragment includes a health check so dependent services wait until the desktop is ready.
- **Secrets** — Add `spec.secrets_placeholders` to manifests; generated presets emit `.env.example` so instructors can note managed credentials.
- **Resources** — Tested on 4-core / 8 GB Codespaces; adjust resolution env vars for low-power Chromebooks.
- **Aggregate compose** — Additional services join `devnet`, letting Supabase/Redis share credentials across local and hosted environments.
