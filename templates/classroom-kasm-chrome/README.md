# Classroom — Kasm Chrome (KasmVNC)

This template runs **Google Chrome** in a sidecar using **Kasm Workspaces** (KasmVNC).  
Default transport is **HTTPS + WebSocket**, which works great in Codespaces and school networks.  
WebRTC fast-path is optionally available in Kasm, but falls back automatically when not possible.

## Quick start
- Open the forwarded **6901** URL in your browser and log in.
- Provide a password via `KASM_VNC_PW` (required; no default shipped).
- The endpoint is HTTPS-only, and Codespaces will happily proxy it even though the port number looks "http".

### Ports
- **6901** – KasmVNC UI (HTTPS + WebSocket)

## Notes
- Increase `shm_size` for stability during heavy browsing.
- Manage extensions/policies in a full Kasm deployment; this template is the minimal sidecar variant.
- Kasm Workspaces Community Edition is distributed under its own [licence](https://www.kasmweb.com/kasm-workspaces-license); review before distribution. See also [docs/sidecars.md#kasm-chrome](../../docs/sidecars.md#kasm-chrome).
- Smoke test script: `scripts/smoke-kasm.sh` checks the HTTPS entrypoint (uses `curl --insecure`).
