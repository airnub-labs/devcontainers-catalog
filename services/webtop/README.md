# Webtop Fragment

This fragment packages the LinuxServer.io Webtop image (Ubuntu MATE) to deliver a full desktop environment through the browser. It supports GUI-based tooling, visual debuggers, and other desktop-first workflows directly within a dev container workspace.

## Ports

- `${WEBTOP_HTTP_PORT:-3000}` → Webtop noVNC session (`http://localhost:3000` by default)

## Usage Tips

- Mounts the workspace into `/work` so files edited in VS Code or the terminal are available inside the desktop session.
- Customize `PUID`, `PGID`, and `TZ` to match your workspace user or timezone requirements.
- Increase `shm_size` if you experience crashes with graphics-intensive applications.

## Aggregate Compose

Include `webtop` in `spec.services` to merge this fragment into `aggregate.compose.yml`, giving students an on-demand desktop for GUI tasks without leaving the devcontainer.
