#!/usr/bin/env bash
set -euo pipefail

if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --version
elif command -v chromium >/dev/null 2>&1; then
    chromium --version
elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --version
else
    echo "No Chrome or Chromium binary was installed" >&2
    exit 1
fi
