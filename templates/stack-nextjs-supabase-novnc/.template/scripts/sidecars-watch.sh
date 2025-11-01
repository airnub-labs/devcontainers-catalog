#!/usr/bin/env bash
set -euo pipefail

if ! command -v watch >/dev/null 2>&1; then
  echo "watch command not available" >&2
  exit 1
fi

SIDECAR_FILTER="${SIDECAR_FILTER:-webtop|novnc|chrome|cdp|redis|supabase|studio|kong|neko|kasm}"
exec watch -n "${WATCH_INTERVAL:-2}" "SIDECAR_FILTER='${SIDECAR_FILTER}' ./scripts/sidecars-status.sh"
