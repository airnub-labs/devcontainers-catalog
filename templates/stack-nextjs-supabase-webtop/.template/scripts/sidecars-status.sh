#!/usr/bin/env bash
set -euo pipefail

: "${SIDECAR_FILTER:=webtop|novnc|chrome|cdp|redis|supabase|studio|kong|neko|kasm}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[sidecars] docker CLI not available in container" >&2
  exit 0
fi

containers=$(docker ps --format '{{.Names}}' | grep -E "${SIDECAR_FILTER}" || true)
if [ -z "${containers}" ]; then
  echo "[sidecars] No matching sidecar containers found." >&2
  exit 0
fi

while IFS= read -r name; do
  state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "${name}" 2>/dev/null || echo n/a)
  echo -e "health\t${name}\t${state}"
done <<<"${containers}"

echo "${containers}" | xargs -r docker stats --no-stream --format 'stats\t{{.Name}}\tCPU={{.CPUPerc}}\tMEM={{.MemUsage}} ({{.MemPerc}})'
