#!/usr/bin/env bash
set -euo pipefail

# Basic smoke test for the Neko sidecar. Expects docker compose stack running locally.
NEKO_URL="${1:-http://localhost:8080/}"

echo "[smoke-neko] Probing ${NEKO_URL}" >&2

if curl --fail --silent --show-error --max-time 10 "${NEKO_URL}" > /dev/null; then
  echo "[smoke-neko] Neko UI reachable" >&2
  exit 0
fi

echo "[smoke-neko] Neko UI unreachable" >&2
exit 1
