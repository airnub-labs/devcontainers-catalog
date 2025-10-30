#!/usr/bin/env bash
set -euo pipefail

FEATURE_DIR="/usr/local/share/devcontainer/features/docker-in-docker-plus"
PROFILE_DIR="/etc/profile.d"
mkdir -p "${FEATURE_DIR}" "${PROFILE_DIR}"

verify_sha256() {
    local expected="$1"
    local file="$2"

    if command -v sha256sum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | sha256sum --check --status
    elif command -v shasum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | shasum -a 256 --check --status
    else
        echo "[docker-in-docker-plus] Neither sha256sum nor shasum available for checksum verification." >&2
        return 1
    fi
}

ensure_buildx() {
    if docker buildx version >/dev/null 2>&1; then
        return 0
    fi

    local arch
    arch=$(uname -m)
    case "${arch}" in
        x86_64) arch=amd64 ;;
        aarch64) arch=arm64 ;;
        *) echo "[docker-in-docker-plus] Unsupported architecture: ${arch}" >&2; return 0 ;;
    esac

    local version
    version=$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | grep -m1 '"tag_name"' | cut -d '"' -f4)
    local tmpdir
    tmpdir=$(mktemp -d)
    trap 'rm -rf "${tmpdir}"' EXIT

    local checksums_url="https://github.com/docker/buildx/releases/download/${version}/checksums.txt"
    if ! curl -fsSL "${checksums_url}" -o "${tmpdir}/checksums.txt"; then
        echo "[docker-in-docker-plus] Failed to download ${checksums_url}" >&2
        return 1
    fi

    local asset="buildx-${version}.linux-${arch}"
    curl -fsSL "https://github.com/docker/buildx/releases/download/${version}/${asset}" -o "${tmpdir}/docker-buildx"

    local expected
    expected=$(awk -v file="${asset}" '
        $1 ~ /^[0-9a-fA-F]{64}$/ && ($2 == file || $NF == file) { print $1; exit }
        match($0, /([0-9a-fA-F]{64})\s+\*?(.+)/, parts) {
            if (parts[2] == file) { print parts[1]; exit }
        }
    ' "${tmpdir}/checksums.txt")

    if [ -z "${expected}" ]; then
        echo "[docker-in-docker-plus] Unable to parse checksum for ${asset}" >&2
        return 1
    fi

    if ! verify_sha256 "${expected}" "${tmpdir}/docker-buildx"; then
        echo "[docker-in-docker-plus] Checksum verification failed for ${asset}" >&2
        return 1
    fi

    install -m 0755 -D "${tmpdir}/docker-buildx" /usr/libexec/docker/cli-plugins/docker-buildx
    rm -rf "${tmpdir}"
    trap - EXIT
}

update_daemon_json() {
    local daemon_file="/etc/docker/daemon.json"
    mkdir -p /etc/docker
    python3 - "$daemon_file" <<'PYTHON'
import json
import os
import sys
path = sys.argv[1]
config = {}
if os.path.exists(path):
    try:
        with open(path) as fh:
            config = json.load(fh)
    except Exception:
        pass
features = config.get("features", {})
if not isinstance(features, dict):
    features = {}
features["buildkit"] = True
config["features"] = features
config.setdefault("default-shm-size", "1g")
with open(path + ".tmp", "w") as fh:
    json.dump(config, fh, indent=2)
os.replace(path + ".tmp", path)
PYTHON
}

configure_profile() {
    cat <<'EOF_ENV' >"${PROFILE_DIR}/docker-buildkit.sh"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
EOF_ENV
}

ensure_buildx
update_daemon_json
configure_profile

touch "${FEATURE_DIR}/feature-installed.txt"
