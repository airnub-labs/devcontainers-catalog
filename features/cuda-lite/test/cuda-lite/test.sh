#!/usr/bin/env bash
set -euo pipefail

FEATURE_DIR="/usr/local/share/devcontainer/features/cuda-lite"
NOTE_FILE="${FEATURE_DIR}/feature-installed.txt"

if [ ! -f "${NOTE_FILE}" ]; then
    echo "cuda-lite installation note not found" >&2
    exit 1
fi

status=$(grep '^status=' "${NOTE_FILE}" | head -n 1 | cut -d'=' -f2)
if [ "${status}" != "installed" ] && [ "${status}" != "skipped" ]; then
    echo "Unexpected status '${status}'" >&2
    exit 1
fi

if [ "${status}" = "installed" ]; then
    if ! command -v nvcc >/dev/null 2>&1; then
        echo "nvcc not found after installation" >&2
        exit 1
    fi
else
    if [ "${CUDA_AVAILABLE:-}" != "false" ]; then
        echo "CUDA_AVAILABLE env var should be false when skipped" >&2
        exit 1
    fi
fi
