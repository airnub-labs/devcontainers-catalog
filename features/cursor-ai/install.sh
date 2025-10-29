#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-latest}"
PACKAGE_NAME="@cursorai/cli"
FEATURE_DIR="/usr/local/share/devcontainer/features/cursor-ai"
STATE_FILE="${FEATURE_DIR}/feature-installed.txt"

mkdir -p "${FEATURE_DIR}"

find_package_json() {
    local root
    if command -v pnpm >/dev/null 2>&1; then
        root="$(pnpm root -g 2>/dev/null || true)"
        if [ -n "${root}" ] && [ -f "${root}/${PACKAGE_NAME}/package.json" ]; then
            printf '%s\n' "${root}/${PACKAGE_NAME}/package.json"
            return 0
        fi
    fi

    if command -v npm >/dev/null 2>&1; then
        root="$(npm root -g 2>/dev/null || true)"
        if [ -n "${root}" ] && [ -f "${root}/${PACKAGE_NAME}/package.json" ]; then
            printf '%s\n' "${root}/${PACKAGE_NAME}/package.json"
            return 0
        fi
    fi

    return 1
}

read_installed_version() {
    local pkg_json
    if pkg_json="$(find_package_json)"; then
        PKG_JSON="${pkg_json}" python3 - <<'PYTHON'
import json
import os
import sys

path = os.environ.get("PKG_JSON")
if not path:
    sys.exit(1)
try:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
except FileNotFoundError:
    sys.exit(1)
version = data.get("version", "")
if version:
    print(version)
PYTHON
        return 0
    fi

    return 1
}

if [ -f "${STATE_FILE}" ]; then
    installed_requested=$(grep '^version=' "${STATE_FILE}" 2>/dev/null | head -n1 | cut -d'=' -f2-)
    if [ -n "${installed_requested}" ]; then
        if [ "${VERSION}" = "latest" ]; then
            if command -v cursor >/dev/null 2>&1; then
                echo "[cursor-ai] Cursor CLI already installed (state file present). Skipping reinstall."
                exit 0
            fi
        elif [ "${installed_requested}" = "${VERSION}" ] && command -v cursor >/dev/null 2>&1; then
            echo "[cursor-ai] Cursor CLI ${VERSION} already installed. Skipping reinstall."
            exit 0
        fi
    fi
fi

PACKAGE_SPEC="${PACKAGE_NAME}"
if [ -n "${VERSION}" ]; then
    if [ "${VERSION}" = "latest" ]; then
        PACKAGE_SPEC="${PACKAGE_NAME}@latest"
    else
        PACKAGE_SPEC="${PACKAGE_NAME}@${VERSION}"
    fi
fi

INSTALLER=""
if command -v pnpm >/dev/null 2>&1; then
    INSTALLER="pnpm"
elif command -v npm >/dev/null 2>&1; then
    INSTALLER="npm"
else
    echo "[cursor-ai] Neither pnpm nor npm is available to install ${PACKAGE_NAME}." >&2
    exit 1
fi

echo "[cursor-ai] Installing ${PACKAGE_SPEC} using ${INSTALLER}."

if [ "${INSTALLER}" = "pnpm" ]; then
    pnpm add --global "${PACKAGE_SPEC}"
else
    npm install -g "${PACKAGE_SPEC}"
fi

RESOLVED_VERSION="${VERSION}"
resolved="$(read_installed_version || true)"
if [ -n "${resolved}" ]; then
    RESOLVED_VERSION="${resolved}"
fi

if ! command -v cursor >/dev/null 2>&1; then
    echo "[cursor-ai] Installation completed but 'cursor' binary not found on PATH." >&2
    exit 1
fi

cat <<EOF_NOTE >"${STATE_FILE}"
version=${RESOLVED_VERSION}
installer=${INSTALLER}
package=${PACKAGE_SPEC}
EOF_NOTE
