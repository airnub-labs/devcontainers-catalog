# Classroom — Kasm Chrome (KasmVNC)

This template runs **Google Chrome** in a sidecar using **Kasm Workspaces** (KasmVNC).  
Default transport is **HTTPS + WebSocket**, which works great in Codespaces and school networks.  
WebRTC fast-path is optionally available in Kasm, but falls back automatically when not possible.

## Quick start
- Open the forwarded **6901** URL in your browser and log in.
- Provide a password via `KASM_VNC_PW` (required; no default shipped).
- The endpoint is HTTPS-only, and Codespaces will happily proxy it even though the port number looks "http".

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Launch the container locally, then follow [Quick start](#quick-start) to open the forwarded 6901 tunnel and authenticate. | Codespaces users follow [Quick start](#quick-start) from the web UI once the workspace boots. | Pair the template with a manifest `spec.base_preset` so the workspace image is prebuilt while the Kasm sidecar stays runtime-only. | Store `KASM_VNC_PW` as a Codespaces secret and share the forwarded link privately when inviting students. |
| Ports | `6901` exposes the Kasm desktop exactly as outlined in [Quick start](#quick-start). | Codespaces proxies the same 6901 HTTPS endpoint. | Port metadata ships with the template so prebuilds need no adjustments. | Leave the port private to avoid exposing the desktop beyond intended participants. |
| Sidecars | Kasm Chrome sidecar starts via compose; no extra setup beyond the template defaults. | Identical compose fragment runs in Codespaces with GPU-independent rendering. | Sidecar image pulls at runtime, keeping prebuild size manageable. | Monitor the Codespaces notification when the sidecar health check completes before sharing the session. |
| Minimum resources | Works best with 4 CPUs / 8 GB locally to give Chrome enough headroom. | Use a 4-core / 8 GB Codespace for smoother Chrome sessions. | Prebuilt workspace image shortens boot even when requesting larger machine types. | Codespaces can auto-scale if you bump `spec.resources`; confirm quotas before workshops. |

### Ports
- **6901** – KasmVNC UI (HTTPS + WebSocket)

## Notes
- Increase `shm_size` for stability during heavy browsing.
- Manage extensions/policies in a full Kasm deployment; this template is the minimal sidecar variant.
- Kasm Workspaces Community Edition is distributed under its own [licence](https://www.kasmweb.com/kasm-workspaces-license); review before distribution. See also [docs/sidecars.md#kasm-chrome](../../docs/sidecars.md#kasm-chrome).
- Smoke test script: `scripts/smoke-kasm.sh` checks the HTTPS entrypoint (uses `curl --insecure`).
