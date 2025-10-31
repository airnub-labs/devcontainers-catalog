# Webtop Fragment

This fragment packages the LinuxServer.io Webtop image (Ubuntu MATE) to deliver a full desktop environment through the browser. It supports GUI-based tooling, visual debuggers, and other desktop-first workflows directly within a dev container workspace.

## Quickstart

```bash
docker compose -f docker-compose.webtop.yml up
```

After building the agent once (`npm --prefix ../../packages/sidecar-agent run build`), the Compose fragment builds a thin layer on top of `ghcr.io/linuxserver/webtop` that installs the sidecar metrics agent.

## Ports

- `${WEBTOP_HTTP_PORT:-3012}` → Webtop noVNC session (`http://localhost:3012` by default)

## Usage Tips

- Mounts the workspace into `/work` so files edited in VS Code or the terminal are available inside the desktop session.
- Customize `PUID`, `PGID`, and `TZ` to match your workspace user or timezone requirements.
- Increase `shm_size` if you experience crashes with graphics-intensive applications.
- Set `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` to protect the desktop (defaults `student` / `change-me`) and mark the forwarded port **Private** in Codespaces.
- Codespaces omits UDP forwarding; this fragment only requires HTTP/WebSocket, so experiences remain consistent across hosts.

## Sidecar Observability

- The container exposes an internal-only metrics endpoint at `http://webtop:4318/metrics`. Poll it from the primary devcontainer using `airnub-devc sidecar status`.
- Metrics include CPU%, memory, top processes, and listening ports—handy for spotting runaway GUI workloads before they exhaust Codespaces credits.
- Control endpoints (`/control/stop` and `/control/restart`) remain disabled by default. Set `SIDECAR_AGENT_CONTROL=1` locally to enable them and use `airnub-devc sidecar stop webtop` to forward a `SIGTERM` into the container.
- The agent never publishes port 4318 externally; Compose only exposes it on the internal network via `expose`.

## Aggregate Compose

Include `webtop` in `spec.services` to merge this fragment into `aggregate.compose.yml`, giving students an on-demand desktop for GUI tasks without leaving the devcontainer.
