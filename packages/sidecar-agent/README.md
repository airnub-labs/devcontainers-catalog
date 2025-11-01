# @airnub/sidecar-agent

A lightweight HTTP agent that exposes health and process metrics for GUI sidecars (webtop, linux-chrome, neko, etc.). The agent is designed to run inside the sidecar container so the primary devcontainer can poll `/metrics` and `/healthz` over the Compose network.

## Features

- JSON metrics with CPU, memory, top processes, uptime, and listening ports.
- Optional control endpoints (`/control/stop`, `/control/restart`) gated behind `SIDECAR_AGENT_CONTROL=1`.
- No privileged operations—reads from `/proc` and shells out to `ps` for per-process stats.
- Works in Codespaces and local Docker; never publishes ports externally.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SIDECAR_AGENT_ENABLE` | `1` | When `0` the entrypoint script skips launching the agent. |
| `SIDECAR_AGENT_SERVICE` | `sidecar` | Friendly service name reported in `/metrics`. |
| `SIDECAR_AGENT_PORT` | `4318` | Internal HTTP port; never publish this publicly. |
| `SIDECAR_AGENT_CONTROL` | `0` | Set to `1` to allow `/control/*` actions (disabled in Codespaces). |
| `SIDECAR_AGENT_TARGET_PID` | entrypoint PID | Process ID that receives stop/restart signals. |

## Endpoints

- `GET /healthz` → `{ status, service, version, controlEnabled }`
- `GET /metrics` → `{ cpu, mem, uptime, proc: [{ name, pid, cpu, mem }], ports, controlEnabled }`
- `POST /control/stop` → Sends `SIGTERM` to `SIDECAR_AGENT_TARGET_PID` (requires `SIDECAR_AGENT_CONTROL=1`).
- `POST /control/restart` → Sends `SIGHUP` to `SIDECAR_AGENT_TARGET_PID` (requires control enabled).

## Running Manually

```bash
npm install
npm run build
SIDECAR_AGENT_SERVICE=demo SIDECAR_AGENT_ENABLE=1 node dist/index.js
```

The server listens on `0.0.0.0:4318` inside the container. Use Compose service DNS (`http://webtop:4318/metrics`) from the devcontainer to consume metrics.

## VS Code Task

Expose a one-click status check inside the primary devcontainer by adding a task:

```jsonc
// .devcontainer/devcontainer.json
{
  "customizations": {
    "vscode": {
      "tasks": {
        "version": "2.0.0",
        "tasks": [
          {
            "label": "Show Sidecar Status",
            "type": "shell",
            "command": "airnub-devc sidecar status"
          }
        ]
      }
    }
  }
}
```

Or add the task to `.vscode/tasks.json` if you prefer to keep editor configuration outside the devcontainer manifest.
