#!/bin/bash
set -euo pipefail

if [ "${SIDECAR_AGENT_ENABLE:-1}" != "0" ]; then
  echo "[sidecar-agent] starting for ${SIDECAR_AGENT_SERVICE:-linux-chrome}"
  SIDECAR_AGENT_TARGET_PID=$$ \
    SIDECAR_AGENT_SERVICE=${SIDECAR_AGENT_SERVICE:-linux-chrome} \
    SIDECAR_AGENT_CONTROL=${SIDECAR_AGENT_CONTROL:-0} \
    SIDECAR_AGENT_PORT=${SIDECAR_AGENT_PORT:-4318} \
    node /opt/sidecar-agent/index.js &
fi

exec /init "$@"
