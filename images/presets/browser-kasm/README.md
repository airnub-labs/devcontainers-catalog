# Browser Kasm preset (stub)

This directory reserves the preset slug for a future prebuilt image tuned for Kasm Chrome.

Runtime guidance:
- Chrome stays in a **sidecar** container; pair this preset with `templates/classroom-kasm-chrome`.
- Prebuilt images can shrink cold starts when bundled with an app stack, but credentials like `VNC_PW` must be supplied at runtime.
