# Browser Neko preset (stub)

This directory reserves the preset slug for a future prebuilt image that bakes in Neko defaults.

Runtime guidance:
- The browser runs as a **sidecar**; pair this preset with `templates/classroom-neko-webrtc`.
- Prebuilt images help reduce cold start when combined with an app stack, but passwords and STUN/TURN config must still flow via env/Secrets.
