# Classroom — Neko (WebRTC) full Chrome

This template runs a **full graphical Chrome** in a sidecar using **Neko** and streams it to the browser via **WebRTC**.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before distributing Neko-powered classrooms.

- **Works in Codespaces (TCP-mux)** and locally (UDP recommended).
- Default is **TCP-only** for maximum compatibility (Codespaces’ port proxy is TCP/HTTPS).
- Add STUN/TURN to improve NAT traversal for home networks.

## Quick start

- Open in Codespaces or locally with Dev Containers.
- The forwarded port **8080** opens the Neko UI.
- Set `NEKO_USER_PASSWORD` and `NEKO_ADMIN_PASSWORD` via Codespaces secrets or `.devcontainer/devcontainer.json` before launch.

### Ports
- **8080** – Neko Web UI
- **59000/tcp** – WebRTC TCP mux (Codespaces-safe)
- **59000/udp** – (optional, local only) WebRTC UDP mux (skip in Codespaces)

## Security
- Provide passwords explicitly (no defaults shipped):
  - Host secrets `NEKO_USER_PASSWORD` and `NEKO_ADMIN_PASSWORD`
  - Container receives `NEKO_MEMBER_MULTIUSER_USER_PASSWORD` / `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD`
- Default screen size targets **1280x800@30** for lower bandwidth. Override `NEKO_SCREEN` to increase fidelity.

## Notes
- For STUN/TURN, set `NEKO_WEBRTC_ICESERVERS_FRONTEND` to a JSON array.
- Example: `[{"urls":["stun:stun.l.google.com:19302"],"username":"turnuser","credential":"turnpass"}]` set via `.devcontainer/devcontainer.json` `containerEnv` or Codespaces secrets.
- In Codespaces, UDP is not available; TCP mux provides reliable fallback.
- Multi-user mode lets an instructor (admin password) and student (member password) share the same Chrome session collaboratively.
- Smoke test script: `scripts/smoke-neko.sh` probes the Web UI once the stack is up.
