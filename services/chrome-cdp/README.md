# Chrome CDP Fragment

This fragment launches a headless Chrome instance (via Browserless) that exposes the Chrome DevTools Protocol (CDP). It is useful for lessons that automate browser interactions with Playwright, Puppeteer, or custom CDP clients without needing a full desktop session.

## Quickstart

```bash
docker compose -f docker-compose.chrome-cdp.yml up
```

## Ports

- `${CHROME_CDP_PORT:-3010}` → CDP HTTP endpoint (`http://localhost:3010` → `chrome-cdp:3000` inside the network)

## Usage Tips

- The container defaults to two concurrent sessions and a 60-second overall timeout. Override `MAX_CONCURRENT_SESSIONS` or `TIMEOUT` in your manifest's environment block if you need different limits.
- Healthchecks poll `http://localhost:3010/json/version`. Wait for a 200 response before starting automated sessions.

## Aggregate Compose

When `chrome-cdp` is listed in `spec.services`, the generator adds this fragment to the aggregate Compose file so workspaces can run headless browser tests next to their application code.
