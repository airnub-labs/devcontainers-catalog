# Classroom — Chrome CDP (Headless)

Headless Chrome (Browserless) exposed over the Chrome DevTools Protocol for automated testing and capture workflows.

## Services

- `devcontainer` — Catalog base image for workspace operations.
- `chrome-cdp` — Browserless Chrome with port `${CHROME_CDP_PORT:-3001}` forwarded to host `3000` inside the container.

## Usage

Materialize the `.template/.devcontainer/` folder into your repo and run `docker compose` with both the workspace compose and the Chrome CDP fragment. The `CHROME_CDP_URL` environment variable is injected for convenience so headless tooling can attach automatically.
