# Classroom — Neko (WebRTC) full Chrome

This template runs a **full graphical Chrome** in a sidecar using **Neko** and streams it to the browser via **WebRTC**.

- **Works in Codespaces (TCP-mux)** and locally (UDP recommended).
- Default is **TCP-only** for maximum compatibility (Codespaces’ port proxy is TCP/HTTPS).
- Add STUN/TURN to improve NAT traversal for home networks.

## Quick start

- Open in Codespaces or locally with Dev Containers.
- The forwarded port **8080** opens the Neko UI.
- Log in with the preset credentials (change them!) and launch Chrome.

### Ports
- **8080** – Neko Web UI
- **59000/tcp** – WebRTC TCP mux (Codespaces-safe)
- **56000–56100/udp** – (optional, local only) WebRTC UDP range

## Security
- Change default passwords immediately:
  - `NEKO_MEMBER_MULTIUSER_USER_PASSWORD`
  - `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD`

## Notes
- For STUN/TURN, set `NEKO_WEBRTC_ICESERVERS_FRONTEND` to a JSON array.
- In Codespaces, UDP is not available; TCP mux provides reliable fallback.
- Smoke test script: `scripts/smoke-neko.sh` probes the Web UI once the stack is up.
