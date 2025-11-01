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

exit_code=0

while IFS= read -r name; do
  state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "${name}" 2>/dev/null || echo n/a)
  printf 'health\t%s\t%s\n' "${name}" "${state}"
  if [ "${state}" != "healthy" ]; then
    exit_code=1
  fi
done <<<"${containers}"

if ! echo "${containers}" | xargs -r docker stats --no-stream --format 'stats\t{{.Name}}\tCPU={{.CPUPerc}}\tMEM={{.MemUsage}} ({{.MemPerc}})'; then
  exit_code=1
fi

exit "${exit_code}"
