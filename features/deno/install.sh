#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-latest}"
INSTALL_COMPLETIONS="${INSTALLCOMPLETIONS:-true}"
CACHE_DIR="${CACHEDIR:-}"
OFFLINE="${OFFLINE:-false}"
FEATURE_DIR="/usr/local/share/devcontainer/features/deno"
BIN_DIR="/usr/local/bin"

mkdir -p "${FEATURE_DIR}"

is_truthy() {
    case "${1:-}" in
        1|[Tt][Rr][Uu][Ee]|[Yy][Ee][Ss])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

copy_from_cache() {
    local filename="$1"
    local destination="$2"

    if [ -z "${CACHE_DIR}" ]; then
        return 1
    fi

    local candidate="${CACHE_DIR%/}/${filename}"
    if [ -f "${candidate}" ]; then
        cp "${candidate}" "${destination}"
        return 0
    fi

    return 1
}

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
    if is_truthy "${OFFLINE}"; then
        echo "[deno] Cannot resolve 'latest' while offline. Please pin a specific version." >&2
        return 1
    fi

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

    if is_truthy "${OFFLINE}"; then
        echo "[deno] unzip is not available and offline mode is enabled. Install unzip ahead of time or disable offline mode." >&2
        exit 1
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

verify_sha256() {
    local expected="$1"
    local file="$2"

    if command -v sha256sum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | sha256sum --check --status
    elif command -v shasum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | shasum -a 256 --check --status
    else
        echo "[deno] Neither sha256sum nor shasum is available for checksum verification." >&2
        return 1
    fi
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

    if copy_from_cache "deno-${target}.zip" "${tmp_dir}/deno.zip"; then
        echo "[deno] Using cached deno-${target}.zip"
    else
        if is_truthy "${OFFLINE}"; then
            echo "[deno] Offline mode enabled but deno-${target}.zip was not found in cacheDir." >&2
            exit 1
        fi

        echo "[deno] Downloading ${url}"
        if ! curl -fsSL "${url}" -o "${tmp_dir}/deno.zip"; then
            echo "[deno] Failed to download ${url}" >&2
            exit 1
        fi
    fi

    local sums_url="https://dl.deno.land/release/${requested}/SHA256SUMS"
    local sums_file="${tmp_dir}/SHA256SUMS"
    if copy_from_cache "SHA256SUMS" "${sums_file}"; then
        :
    else
        if is_truthy "${OFFLINE}"; then
            echo "[deno] Offline mode enabled but SHA256SUMS was not found in cacheDir." >&2
            exit 1
        fi

        if ! curl -fsSL "${sums_url}" -o "${sums_file}"; then
            echo "[deno] Failed to download ${sums_url}" >&2
            exit 1
        fi
    fi

    local expected
    expected=$(awk -v target="deno-${target}.zip" '$2 == target {print $1}' "${sums_file}")
    if [ -z "${expected}" ]; then
        echo "[deno] Unable to locate checksum for deno-${target}.zip in ${sums_url}" >&2
        exit 1
    fi

    if ! verify_sha256 "${expected}" "${tmp_dir}/deno.zip"; then
        echo "[deno] Checksum verification failed for deno-${target}.zip" >&2
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
