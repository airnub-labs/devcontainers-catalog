# dev-web Image

Extends the `ghcr.io/airnub-labs/devcontainer-images/dev-base` image with Node.js, pnpm, Python 3, and browser runtime
dependencies. Chrome repositories are pre-seeded so the `chrome-cdp` feature can install browsers quickly. Use this image for
web-forward templates that need JavaScript tooling out of the box.

Pull from GHCR:

```
docker pull ghcr.io/airnub-labs/devcontainer-images/dev-web:latest
```

## Build-time customization

- `BASE_IMAGE` — defaults to `ghcr.io/airnub-labs/devcontainer-images/dev-base:latest`.
- `NODE_MAJOR` — Node.js major version installed from NodeSource (defaults to `24`).
- `PYTHON_VERSION` — Python version for apt packages (defaults to `3.12`).
- `PNPM_HOME` / `PNPM_STORE_PATH` — override pnpm directories if you change the default user.
- `USERNAME` — defaults to `vscode`; update when the downstream base image changes the primary user.

Tweak these args to align with downstream template requirements without editing the Dockerfile structure.
