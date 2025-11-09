#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-latest}"
CACHE_DIR="${CACHEDIR:-}"
OFFLINE="${OFFLINE:-false}"
FEATURE_DIR="/usr/local/share/devcontainer/features/temporal-cli"
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
        echo "[temporal-cli] Cannot resolve 'latest' while offline. Please pin a specific version." >&2
        return 1
    fi

    python3 - <<'PYTHON'
import json
import sys
import urllib.error
import urllib.request

API_URL = "https://api.github.com/repos/temporalio/cli/releases/latest"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "devcontainers-feature-temporal-cli",
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
except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)

tag = payload.get("tag_name")
if not tag:
    print("missing tag_name in Temporal CLI release payload", file=sys.stderr)
    sys.exit(1)

print(tag)
PYTHON
}

ensure_tar() {
    if command -v tar >/dev/null 2>&1; then
        return 0
    fi

    if is_truthy "${OFFLINE}"; then
        echo "[temporal-cli] tar is not available and offline mode is enabled. Install tar ahead of time or disable offline mode." >&2
        exit 1
    fi

    apt-get update
    local log_file="/tmp/temporal-cli-feature-apt.log"
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends tar >"${log_file}" 2>&1
    if [ ! -s "${log_file}" ]; then
        rm -f "${log_file}"
    fi
    rm -rf /var/lib/apt/lists/*
}

resolve_platform_arch() {
    local arch
    arch=$(dpkg --print-architecture)

    local platform="linux"
    local cli_arch

    case "${arch}" in
        amd64)
            cli_arch="amd64"
            ;;
        arm64)
            cli_arch="arm64"
            ;;
        *)
            echo "[temporal-cli] Unsupported architecture: ${arch}" >&2
            return 1
            ;;
    esac

    echo "${platform} ${cli_arch}"
}

install_temporal_cli() {
    local requested
    requested=$(normalize_version "${VERSION}")

    if [ "${requested}" = "latest" ]; then
        if ! requested=$(fetch_latest_tag); then
            echo "[temporal-cli] Failed to determine latest Temporal CLI release tag." >&2
            exit 1
        fi
    fi

    local current_version=""
    if command -v temporal >/dev/null 2>&1; then
        # Try to get version from temporal command
        current_version=$(temporal --version 2>/dev/null | grep -oP 'temporal version \K[0-9.]+' || echo "")
        if [ -n "${current_version}" ]; then
            current_version="v${current_version#v}"
        fi
    fi

    if [ -n "${current_version}" ] && [ "${current_version}" = "${requested}" ]; then
        echo "[temporal-cli] Temporal CLI ${requested} already installed. Skipping."
        echo "${requested}" >"${FEATURE_DIR}/version"
        return 0
    fi

    ensure_tar

    local platform_arch
    if ! platform_arch=$(resolve_platform_arch); then
        exit 1
    fi

    read -r platform arch <<< "${platform_arch}"

    # Remove the 'v' prefix for the download URL
    local version_no_v="${requested#v}"

    # Temporal CLI release asset naming: temporal_cli_<version>_<platform>_<arch>.tar.gz
    local archive_name="temporal_cli_${version_no_v}_${platform}_${arch}.tar.gz"
    local url="https://github.com/temporalio/cli/releases/download/${requested}/${archive_name}"

    local tmp_dir
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "${tmp_dir}"' EXIT

    if copy_from_cache "${archive_name}" "${tmp_dir}/temporal.tar.gz"; then
        echo "[temporal-cli] Using cached ${archive_name}"
    else
        if is_truthy "${OFFLINE}"; then
            echo "[temporal-cli] Offline mode enabled but ${archive_name} was not found in cacheDir." >&2
            exit 1
        fi

        echo "[temporal-cli] Downloading ${url}"
        if ! curl -fsSL "${url}" -o "${tmp_dir}/temporal.tar.gz"; then
            echo "[temporal-cli] Failed to download ${url}" >&2
            exit 1
        fi
    fi

    # Extract the archive
    tar -xzf "${tmp_dir}/temporal.tar.gz" -C "${tmp_dir}"

    # Install the binary
    install -m 0755 "${tmp_dir}/temporal" "${BIN_DIR}/temporal"

    echo "${requested}" >"${FEATURE_DIR}/version"

    rm -rf "${tmp_dir}"
    trap - EXIT
}

install_temporal_cli

# Verify installation
if command -v temporal >/dev/null 2>&1; then
    temporal --version
else
    echo "[temporal-cli] Warning: temporal command not found after installation" >&2
    exit 1
fi
