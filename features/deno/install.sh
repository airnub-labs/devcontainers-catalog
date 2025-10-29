#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-latest}"
INSTALL_COMPLETIONS="${INSTALLCOMPLETIONS:-true}"
FEATURE_DIR="/usr/local/share/devcontainer/features/deno"
BIN_DIR="/usr/local/bin"

mkdir -p "${FEATURE_DIR}"

normalize_version() {
    local raw="$1"
    if [ -z "${raw}" ] || [ "${raw}" = "latest" ]; then
        echo "latest"
        return 0
    fi

    if [[ "${raw}" == v* ]]; then
        echo "${raw}"
    else
        echo "v${raw}"
    fi
}

fetch_latest_tag() {
    python3 - <<'PYTHON'
import json
import sys
import urllib.error
import urllib.request

API_URL = "https://api.github.com/repos/denoland/deno/releases/latest"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "devcontainers-feature-deno",
}

request = urllib.request.Request(API_URL, headers=HEADERS)

try:
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise urllib.error.HTTPError(
                API_URL,
                response.status,
                f"unexpected status: {response.status}",
                response.headers,
                None,
            )
        payload = json.load(response)
except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:  # pragma: no cover - defensive
    print(exc, file=sys.stderr)
    sys.exit(1)

tag = payload.get("tag_name")
if not tag:
    print("missing tag_name in Deno release payload", file=sys.stderr)
    sys.exit(1)

print(tag)
PYTHON
}

ensure_unzip() {
    if command -v unzip >/dev/null 2>&1; then
        return 0
    fi

    apt-get update
    local log_file="/tmp/deno-feature-apt.log"
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends unzip >"${log_file}" 2>&1
    if [ ! -s "${log_file}" ]; then
        rm -f "${log_file}"
    fi
    rm -rf /var/lib/apt/lists/*
}

resolve_target() {
    local arch
    arch=$(dpkg --print-architecture)
    case "${arch}" in
        amd64)
            echo "x86_64-unknown-linux-gnu"
            ;;
        arm64)
            echo "aarch64-unknown-linux-gnu"
            ;;
        *)
            echo "[deno] Unsupported architecture: ${arch}" >&2
            return 1
            ;;
    esac
}

install_deno() {
    local requested
    requested=$(normalize_version "${VERSION}")

    if [ "${requested}" = "latest" ]; then
        if ! requested=$(fetch_latest_tag); then
            echo "[deno] Failed to determine latest Deno release tag." >&2
            exit 1
        fi
    fi

    local current_version=""
    if command -v deno >/dev/null 2>&1; then
        current_version=$(deno --version | awk '/deno/ {print $2}')
        current_version="v${current_version#v}"
    fi

    if [ "${current_version}" = "${requested}" ]; then
        echo "[deno] Deno ${requested} already installed. Skipping."
        echo "${requested}" >"${FEATURE_DIR}/version"
        return 0
    fi

    ensure_unzip

    local target
    if ! target=$(resolve_target); then
        exit 1
    fi

    local url="https://dl.deno.land/release/${requested}/deno-${target}.zip"
    local tmp_dir
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "${tmp_dir}"' EXIT

    echo "[deno] Downloading ${url}"
    if ! curl -fsSL "${url}" -o "${tmp_dir}/deno.zip"; then
        echo "[deno] Failed to download ${url}" >&2
        exit 1
    fi

    unzip -q "${tmp_dir}/deno.zip" -d "${tmp_dir}"
    install -m 0755 "${tmp_dir}/deno" "${BIN_DIR}/deno"

    echo "${requested}" >"${FEATURE_DIR}/version"

    rm -rf "${tmp_dir}"
    trap - EXIT
}

install_completions() {
    if [ "${INSTALL_COMPLETIONS}" != "true" ]; then
        return 0
    fi

    if ! command -v deno >/dev/null 2>&1; then
        echo "[deno] Skipping completions; deno binary not found." >&2
        return 0
    fi

    mkdir -p /etc/bash_completion.d
    deno completions bash > /etc/bash_completion.d/deno

    mkdir -p /usr/share/zsh/site-functions
    deno completions zsh > /usr/share/zsh/site-functions/_deno

    mkdir -p /usr/share/fish/vendor_completions.d
    deno completions fish > /usr/share/fish/vendor_completions.d/deno.fish
}

install_deno
install_completions

deno --version
