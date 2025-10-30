#!/usr/bin/env bash
set -euo pipefail

# Basic smoke test for the Kasm Chrome sidecar.
KASM_URL="${1:-https://localhost:6901/}"

echo "[smoke-kasm] Probing ${KASM_URL}" >&2

curl --fail --silent --show-error --max-time 10 --insecure "${KASM_URL}" > /dev/null && {
  echo "[smoke-kasm] Kasm UI reachable" >&2
  exit 0
}

echo "[smoke-kasm] Kasm UI unreachable" >&2
exit 1
