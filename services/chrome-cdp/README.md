# Chrome CDP Fragment

This fragment launches a headless Chrome instance (via Browserless) that exposes the Chrome DevTools Protocol (CDP). It is useful for lessons that automate browser interactions with Playwright, Puppeteer, or custom CDP clients without needing a full desktop session.

## Ports

- `${CHROME_CDP_PORT:-3001}` → CDP HTTP endpoint (`http://localhost:3001` by default)

## Usage Tips

- The container defaults to two concurrent sessions and a 60-second overall timeout. Override `MAX_CONCURRENT_SESSIONS` or `TIMEOUT` in your manifest's environment block if you need different limits.
- Healthchecks poll `http://localhost:3000` inside the container. When composing multiple services, allow a short warm-up period before running automated tests.

## Aggregate Compose

When `chrome-cdp` is listed in `spec.services`, the generator adds this fragment to the aggregate Compose file so workspaces can run headless browser tests next to their application code.
