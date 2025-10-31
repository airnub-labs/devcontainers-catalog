# Linux Chrome Fragment

This fragment launches the LinuxServer.io Chrome container, providing a lightweight Linux desktop accessible through the browser (noVNC). It is ideal for lessons that require a GUI to demo web tooling, inspector workflows, or desktop automation from low-powered devices.

## Quickstart

```bash
docker compose -f docker-compose.linux-chrome.yml up
```

## Ports

- `${LINUX_CHROME_HTTP_PORT:-3011}` → Web UI / noVNC session (`http://localhost:3011` by default)

## Usage Tips

- The container mounts the workspace root into `/work` so files edited in the dev container are accessible in Chrome downloads or uploads.
- Adjust `PUID`, `PGID`, and `TZ` via environment variables if your preset requires different user IDs or time zones.
- Allocate sufficient shared memory (`shm_size: 1g`) for more stable browser sessions; increase this value for graphics-heavy sites.
- Set `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` (defaults `student` / `change-me`) to guard the noVNC session. In Codespaces, mark the forwarded port **Private**.
- Codespaces does not support UDP forwarding; Chrome remote control continues to work because the fragment relies solely on HTTP/WebSocket traffic.

## Aggregate Compose

Declaring `linux-chrome` in `spec.services` injects this fragment into the aggregate Compose file, giving students a ready-to-use remote browser alongside their code environment.
