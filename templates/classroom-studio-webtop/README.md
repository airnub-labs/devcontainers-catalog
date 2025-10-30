# Classroom Studio (Webtop) Template

Multi-container template featuring a headless development container plus a `linuxserver/webtop` sidecar for touch-friendly Chrome debugging. The dev service lives in `.template/docker-compose.yml` while the shared `services/webtop/docker-compose.webtop.yml` fragment provides the GUI sidecar. Template options let you:

- Pick whether the webtop mounts managed Chrome policies (`policyMode`).
- Override the policy file that gets mounted via `chromePolicies` (leave blank to follow the selected policy mode).
- Adjust the forwarded desktop port (`webtopPort`). Use the forwarded port output in your Codespace/local environment to open the desktop at `https://127.0.0.1:{{templateOption.webtopPort}}/`.
