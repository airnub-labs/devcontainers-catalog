# Sidecar Health and Metrics

This catalog standardizes lightweight health and resource reporting for every sidecar so that Codespaces and local Dev Container sessions expose the same signals.

## Why healthchecks matter

Docker healthchecks give the orchestrator a consistent indicator for whether a browser or database sidecar is ready. Without them, `depends_on` ordering and the VS Code **PORTS** view have no way to reflect readiness. Each sidecar now ships with:

- A Docker `healthcheck` definition that prefers HTTP probes and falls back to TCP when necessary.
- Friendly port labels surfaced through the `remote.portsAttributes` VS Code setting.
- A post-start script (`./scripts/sidecars-status.sh`) that prints health state and a one-shot CPU/memory snapshot.

The probes are intentionally minimal: BusyBox `wget`/`nc` when available, otherwise `/dev/tcp/` fallbacks. No background metrics agents or Prometheus exporters are introduced.

## Probe summary

| Sidecar | Probe | Notes |
|---------|-------|-------|
| `novnc` | HTTP `GET /` on `6080` | `wget` → `curl` → TCP fallback keeps the probe working even when BusyBox tools vary. |
| `webtop` | HTTP `GET /` on container port `3000` | Same HTTP → TCP cascade as `novnc`. |
| `neko-chrome`, `neko-firefox` | HTTP `GET /` on `8080`/`8081` | Browser desktops keep the same fallback chain so the probe survives minimal base images. |
| `kasm-chrome` | HTTPS `GET /` on `6901` | Uses `wget --no-check-certificate` then `curl -k` before falling back to TCP, matching the self-signed cert the image ships with. |
| `linux-chrome` | HTTP `GET /` on `3000` | Identical HTTP → TCP fallback used for other browser desktops. |
| `chrome-cdp` | HTTP `GET /json/version` on `3000` | Browserless exposes an HTTP metadata endpoint that responds quickly when Chrome is ready. |
| `redis` | `redis-cli ping` expecting `PONG` | Falls back to TCP `6379` via `nc` or `/dev/tcp` when the CLI is unavailable. |
| `supabase-db` | `pg_isready` (falls back to TCP `5432`) | Prefers Postgres' readiness probe before dropping to a TCP connect. |
| `supabase-rest` | HTTP `GET /` on `3000` | Gives PostgREST a little extra start period before falling back to TCP. |
| `supabase-realtime` | HTTP `GET /health` on `4000` | Uses the built-in `/health` endpoint with the same HTTP fallbacks. |
| `supabase-studio` | HTTP `GET /` on `3000` | Same HTTP → TCP fallback chain, tuned with longer start period. |
| `dagster` | HTTP `GET /` on `3000` | Waits for the Dagster UI to serve HTML before reporting healthy. |
| `prefect` | HTTP `GET /api/health` on `4200` | Prefect exposes a JSON health payload; probe falls back to TCP. |
| `temporal` | TCP connect to `7233` | Cheap gRPC port probe with longer retries for cold starts. |
| `temporal-ui` | HTTP `GET /health` on `8080` | UI health endpoint with the HTTP fallback cascade. |
| `airflow` | HTTP `GET /health` on `8080` | Uses the Airflow webserver health endpoint before TCP fallback. |
| `kafka` | TCP connect to `9092` | Keeps the probe lightweight for the single-broker KRaft setup. |
| `inbucket` | HTTP `GET /` on `9000` | Basic HTTP probe, suitable for the testing SMTP UI. |

Every emitted `healthcheck` uses Compose `CMD-SHELL` arrays so we can express these fallback chains without installing additional packages.

## Using the status scripts

After the devcontainer service starts, the `postStartCommand` runs `./scripts/sidecars-status.sh`. You can invoke it manually at any time:

```bash
./scripts/sidecars-status.sh
```

Sample output:

```
health	stack-webtop	healthy
health	stack-redis	healthy
stats	stack-webtop	CPU=0.10%	MEM=150MiB (5.2%)
stats	stack-redis	CPU=0.01%	MEM=25MiB (1.8%)
```

For a continuously updating view, use the optional watch helper:

```bash
./scripts/sidecars-watch.sh
```

Set `SIDECAR_FILTER` to narrow the match list, and `WATCH_INTERVAL` (seconds) to slow the refresh cadence.

## Codespaces PORTS view

Because browser sidecars run in sibling containers, the **Process** column in the PORTS view remains blank. With the new labels you will now see entries such as “noVNC (sidecar)” or “Redis (sidecar)” that map cleanly back to the compose services.

## Adding new sidecars

1. Extend `catalog/sidecars.json` with the container image, default port, and `health` metadata (set `method` to `http`, `tcp`, `cmd`, or `postgres` and include ports/commands as needed).
2. Run the catalog generator to update affected templates; it injects the correct Compose `healthcheck` stanza plus port labels automatically.
3. Ensure the devcontainer mounts the Docker socket and calls the status script (the generator handles this for new stacks).
4. Run `npm test` inside `tools/catalog-generator` to verify the generator emits the new health wiring.

All sidecars should remain cheap to probe and must not rely on heavy instrumentation stacks.
