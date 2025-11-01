#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-latest}"
MANAGE_LOCAL_STACK="${MANAGELOCALSTACK:-false}"
PROJECT_REF="${PROJECTREF:-}"
SERVICES_RAW="${SERVICES:-}"
CACHE_DIR="${CACHEDIR:-}"
OFFLINE="${OFFLINE:-false}"
FEATURE_DIR="/usr/local/share/devcontainer/features/supabase-cli"
BIN_DIR="/usr/local/bin"
PROFILE_DIR="/etc/profile.d"

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

verify_sha256() {
    local expected="$1"
    local file="$2"

    if command -v sha256sum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | sha256sum --check --status
    elif command -v shasum >/dev/null 2>&1; then
        printf '%s  %s\n' "${expected}" "${file}" | shasum -a 256 --check --status
    else
        echo "[supabase-cli] Neither sha256sum nor shasum is installed; cannot verify checksums." >&2
        return 1
    fi
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
    python3 - <<'PYTHON'
import json
import sys
import urllib.error
import urllib.request

API_URL = "https://api.github.com/repos/supabase/cli/releases/latest"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "devcontainers-feature-supabase-cli",
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
    print("missing tag_name in Supabase release payload", file=sys.stderr)
    sys.exit(1)

print(tag)
PYTHON
}

install_supabase_cli() {
    local requested
    requested=$(normalize_version "${VERSION}")

    if [ "${requested}" = "latest" ]; then
        if is_truthy "${OFFLINE}"; then
            echo "[supabase-cli] Cannot resolve 'latest' while offline. Please pin a specific version." >&2
            exit 1
        fi

        if ! requested=$(fetch_latest_tag); then
            echo "[supabase-cli] Failed to determine latest Supabase CLI release tag." >&2
            exit 1
        fi
    fi

    local arch
    arch=$(dpkg --print-architecture)
    case "${arch}" in
        amd64|arm64)
            ;;
        *)
            echo "[supabase-cli] Unsupported architecture: ${arch}" >&2
            exit 1
            ;;
    esac

    local current_version=""
    if command -v supabase >/dev/null 2>&1; then
        current_version=$(supabase --version | awk '{print $NF}')
        current_version="v${current_version#v}"
    fi

    if [ "${current_version}" = "${requested}" ]; then
        echo "[supabase-cli] Supabase CLI ${requested} already installed. Skipping."
        return 0
    fi

    local deb_basename="supabase_${requested#v}_linux_${arch}.deb"
    local deb_url="https://github.com/supabase/cli/releases/download/${requested}/${deb_basename}"
    local tmp_deb
    tmp_deb=$(mktemp -d)
    trap 'rm -rf "${tmp_deb:-}"' EXIT

    if copy_from_cache "${deb_basename}" "${tmp_deb}/supabase.deb"; then
        echo "[supabase-cli] Using cached ${deb_basename}"
    else
        if is_truthy "${OFFLINE}"; then
            echo "[supabase-cli] Offline mode enabled but ${deb_basename} was not found in cacheDir." >&2
            exit 1
        fi

        echo "[supabase-cli] Downloading ${deb_url}"
        curl -fsSL "${deb_url}" -o "${tmp_deb}/supabase.deb"
    fi

    local checksum_candidates=(
        "https://github.com/supabase/cli/releases/download/${requested}/supabase_${requested#v}_SHA256SUMS"
        "https://github.com/supabase/cli/releases/download/${requested}/supabase_${requested#v}_checksums.txt"
        "https://github.com/supabase/cli/releases/download/${requested}/${deb_basename}.sha256"
    )

    local checksum_file=""
    for url in "${checksum_candidates[@]}"; do
        local filename
        filename=$(basename "${url}")

        if copy_from_cache "${filename}" "${tmp_deb}/${filename}"; then
            checksum_file="${tmp_deb}/${filename}"
            break
        fi

        if is_truthy "${OFFLINE}"; then
            continue
        fi

        if curl -fsSL "${url}" -o "${tmp_deb}/${filename}"; then
            checksum_file="${tmp_deb}/${filename}"
            break
        fi
    done

    if [ -z "${checksum_file}" ]; then
        if is_truthy "${OFFLINE}"; then
            echo "[supabase-cli] Offline mode enabled but no checksum file for ${deb_basename} was found in cacheDir." >&2
        else
            echo "[supabase-cli] Failed to download checksum for ${deb_basename}" >&2
        fi
        exit 1
    fi

    local expected
    expected=$(awk -v file="${deb_basename}" '
        $1 ~ /^[0-9a-fA-F]{64}$/ && ($2 == file || $NF == file) { print $1; exit }
        match($0, /SHA256\s*\(([^)]+)\)\s*=\s*([0-9a-fA-F]{64})/, parts) {
            if (parts[1] == file) { print parts[2]; exit }
        }
        match($0, /([0-9a-fA-F]{64})\s+\*?(.+)/, parts) {
            if (parts[2] == file) { print parts[1]; exit }
        }
    ' "${checksum_file}")

    if [ -z "${expected}" ]; then
        echo "[supabase-cli] Unable to parse checksum for ${deb_basename}" >&2
        exit 1
    fi

    if ! verify_sha256 "${expected}" "${tmp_deb}/supabase.deb"; then
        echo "[supabase-cli] Checksum verification failed for ${deb_basename}" >&2
        exit 1
    fi

    if ! is_truthy "${OFFLINE}"; then
        apt-get update
    else
        echo "[supabase-cli] Skipping apt-get update due to offline mode. Ensure dependencies are already available." >&2
    fi

    local log_file="/tmp/supabase-cli-install.log"
    : >"${log_file}"

    if ! DEBIAN_FRONTEND=noninteractive dpkg -i "${tmp_deb}/supabase.deb" >"${log_file}" 2>&1; then
        if is_truthy "${OFFLINE}"; then
            echo "[supabase-cli] Failed to install Supabase CLI deb in offline mode. Ensure dependencies are pre-installed. See ${log_file}." >&2
            exit 1
        fi

        echo "[supabase-cli] Resolving Supabase CLI dependencies (see ${log_file})"
        DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends -f \
            >>"${log_file}" 2>&1
        DEBIAN_FRONTEND=noninteractive dpkg -i "${tmp_deb}/supabase.deb" >>"${log_file}" 2>&1
    fi

    if [ ! -s "${log_file}" ]; then
        rm -f "${log_file}"
    fi

    rm -rf "${tmp_deb}"
    trap - EXIT
}

resolve_services() {
    python3 - <<'PYTHON'
import json
import os

services = []
raw = os.environ.get("SERVICES_RAW", "").strip()
if raw:
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            services.extend(str(item) for item in parsed)
        elif isinstance(parsed, str):
            services.append(parsed)
    except json.JSONDecodeError:
        services.extend(part.strip() for part in raw.split(',') if part.strip())

for key, value in sorted(os.environ.items()):
    if key.startswith("SERVICES__") and value:
        services.append(value)

seen = []
for item in services:
    if item not in seen:
        seen.append(item)

if seen:
    print(",".join(seen))
PYTHON
}

install_helper_scripts() {
    cat <<'SCRIPT' >"${BIN_DIR}/sbx-start"
#!/usr/bin/env bash
set -euo pipefail
exec supabase start "$@"
SCRIPT
    chmod +x "${BIN_DIR}/sbx-start"

    cat <<'SCRIPT' >"${BIN_DIR}/sbx-stop"
#!/usr/bin/env bash
set -euo pipefail
exec supabase stop "$@"
SCRIPT
    chmod +x "${BIN_DIR}/sbx-stop"

    cat <<'SCRIPT' >"${BIN_DIR}/sbx-status"
#!/usr/bin/env bash
set -euo pipefail
exec supabase status "$@"
SCRIPT
    chmod +x "${BIN_DIR}/sbx-status"
}

install_supabase_cli

if [ -n "${PROJECT_REF}" ]; then
    mkdir -p "${PROFILE_DIR}"
    cat <<EOF_ENV >"${PROFILE_DIR}/supabase-cli.sh"
export SUPABASE_PROJECT_REF="${PROJECT_REF}"
EOF_ENV
else
    rm -f "${PROFILE_DIR}/supabase-cli.sh"
fi

if [ "${MANAGE_LOCAL_STACK}" = "true" ]; then
    install_helper_scripts
else
    rm -f "${BIN_DIR}/sbx-start" "${BIN_DIR}/sbx-stop" "${BIN_DIR}/sbx-status"
fi

SERVICES_LIST="$(SERVICES_RAW="${SERVICES_RAW}" resolve_services)"

cat <<EOF_NOTE >"${FEATURE_DIR}/feature-installed.txt"
version=${VERSION}
manageLocalStack=${MANAGE_LOCAL_STACK}
projectRef=${PROJECT_REF}
services=${SERVICES_LIST}
EOF_NOTE
