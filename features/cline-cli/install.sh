#!/usr/bin/env bash
set -euo pipefail

FEATURE_DIR="/usr/local/share/devcontainer/features/cline-cli"
STATE_FILE="${FEATURE_DIR}/feature-installed.txt"

mkdir -p "${FEATURE_DIR}"

log() {
    echo "[cline-cli] $*"
}

ensure_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi

    if command -v corepack >/dev/null 2>&1; then
        if corepack enable pnpm >/dev/null 2>&1; then
            if command -v pnpm >/dev/null 2>&1; then
                return 0
            fi
        fi

        if corepack prepare pnpm@latest --activate >/dev/null 2>&1; then
            if command -v pnpm >/dev/null 2>&1; then
                return 0
            fi
        fi
    fi

    log "pnpm is required to install Cline. Install the Node.js feature with pnpm support or make pnpm available before applying this feature."
    return 1
}

install_cline() {
    local pnpm_bin
    pnpm_bin=$(command -v pnpm)

    log "Installing Cline via ${pnpm_bin}."
    "${pnpm_bin}" add --global cline
}

resolve_version() {
    local pnpm_bin pkg_root pkg_json
    pnpm_bin=$(command -v pnpm)
    if [ -z "${pnpm_bin}" ]; then
        return 0
    fi

    pkg_root=$("${pnpm_bin}" root -g 2>/dev/null || true)
    if [ -z "${pkg_root}" ]; then
        return 0
    fi

    pkg_json="${pkg_root%/}/cline/package.json"
    if [ ! -f "${pkg_json}" ]; then
        return 0
    fi

    VERSION_JSON="${pkg_json}" python3 - <<'PYTHON'
import json
import os
import sys

path = os.environ.get("VERSION_JSON")
if not path:
    sys.exit(0)
try:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
except (FileNotFoundError, json.JSONDecodeError):
    sys.exit(0)
version = data.get("version")
if version:
    print(version)
PYTHON
}

ensure_pnpm
install_cline

if ! command -v cline >/dev/null 2>&1; then
    log "Cline CLI was installed but the 'cline' binary is not on PATH."
    exit 1
fi

log "Cline CLI installed: $(cline --version 2>/dev/null || echo 'version unknown')"

resolved_version=$(resolve_version || true)
if [ -z "${resolved_version}" ] && command -v cline >/dev/null 2>&1; then
    resolved_version=$(cline --version 2>/dev/null | head -n1 | tr -d '\r' || true)
fi

cat <<EOF_STATE >"${STATE_FILE}"
installer=pnpm
pnpm=$(command -v pnpm 2>/dev/null)
version=${resolved_version:-unknown}
EOF_STATE
