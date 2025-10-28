#!/usr/bin/env bash
set -euo pipefail

if ! command -v codex >/dev/null 2>&1; then
    echo "codex CLI not found" >&2
    exit 1
fi

codex --version >/dev/null 2>&1 || codex help >/dev/null 2>&1 || true
