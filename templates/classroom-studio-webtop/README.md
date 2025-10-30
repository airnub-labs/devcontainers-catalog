# Classroom Studio (Webtop) Template

Multi-container template featuring a headless development container plus a `linuxserver/webtop` sidecar for touch-friendly Chrome debugging. Template options let you:

- Pick whether the webtop mounts managed Chrome policies (`policyMode`).
- Override the policy file that gets mounted via `chromePolicies` (leave blank to follow the selected policy mode).
- Adjust the forwarded desktop port (`webtopPort`).

When launched, access the desktop at `http://localhost:<webtopPort>` (default `http://localhost:3000`) via the shared `services/webtop/docker-compose.webtop.yml` fragment. The override compose file mounts `.devcontainer/policies` into Chrome so managed presets stay in sync.
