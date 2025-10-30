# Classroom — Webtop (Desktop via Browser)

This template pairs the standard catalog devcontainer image with the `linuxserver/webtop` sidecar so students can access a full desktop over the browser.

## Services

- `devcontainer` — Codespaces-compatible workspace container using the catalog base image.
- `webtop` — Desktop sidecar exposed on `${WEBTOP_HTTP_PORT:-3000}`.

## Usage

Copy the `.template/.devcontainer/` folder into your repository or apply this template via `devcontainer templates apply`. Bring the stack online with `docker compose -f .devcontainer/docker-compose.yml -f services/webtop/docker-compose.webtop.yml up -d webtop` or use the catalog `stack-up` target with `WEBTOP=1`.
