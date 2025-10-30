#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env.local"
SERVICES_LIST=""
WAIT_TIMEOUT=90
WAIT_INTERVAL=2
PASSTHROUGH=()

log() {
    echo "[supabase-up] $*" >&2
}

usage() {
    cat <<'USAGE'
Usage: supabase-up.sh [options] [-- <supabase start args>]

Options:
  --project-dir <dir>   Supabase project directory (default: repository supabase/)
  --env-file <file>     Environment file to source before launching (default: <project>/.env.local)
  --services <list>     Comma-separated allowlist of services to start (db,auth,rest,realtime,storage,studio,imgproxy,vector,pgbouncer,logflare,inbucket)
  --timeout <seconds>   Seconds to wait for supabase status to succeed (default: 90)
  --interval <seconds>  Polling interval while waiting for readiness (default: 2)
  -h, --help            Show this help message

Additional arguments after "--" are passed directly to `supabase start`.
USAGE
}

contains() {
    local needle="$1"
    shift || true
    for item in "$@"; do
        if [ "${item}" = "${needle}" ]; then
            return 0
        fi
    done
    return 1
}

load_env_file() {
    local file="$1"
    if [ ! -f "${file}" ]; then
        log "Environment file ${file} not found; continuing without it."
        return 0
    fi

    while IFS= read -r line || [ -n "${line}" ]; do
        line="${line%%$'\r'}"
        case "${line}" in
            ""|\#*)
                continue
                ;;
        esac

        if [[ ! "${line}" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            log "Skipping malformed line in ${file}: ${line}"
            continue
        fi

        local key="${line%%=*}"
        local value="${line#*=}"
        value="$(printf '%s' "${value}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        if [[ "${value}" =~ ^".*"$ ]]; then
            value="${value:1:-1}"
        elif [[ "${value}" =~ ^'.*'$ ]]; then
            value="${value:1:-1}"
        fi

        export "${key}=${value}"
    done <"${file}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project-dir)
            PROJECT_DIR="$(cd "$2" && pwd)"
            shift 2
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --services)
            SERVICES_LIST="$2"
            shift 2
            ;;
        --timeout)
            WAIT_TIMEOUT="$2"
            shift 2
            ;;
        --interval)
            WAIT_INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            PASSTHROUGH+=("$@")
            break
            ;;
        *)
            PASSTHROUGH+=("$1")
            shift
            ;;
    esac
done

if ! command -v supabase >/dev/null 2>&1; then
    log "Supabase CLI not found in PATH. Install it before running this helper."
    exit 1
fi

load_env_file "${ENV_FILE}"

KNOWN_SERVICES=(db auth rest realtime storage studio imgproxy vector pgbouncer logflare inbucket)
REQUESTED_SERVICES=()
if [ -n "${SERVICES_LIST}" ]; then
    IFS=',' read -ra TOKENS <<<"${SERVICES_LIST}"
    for token in "${TOKENS[@]}"; do
        token="${token,,}"
        token="${token//[^a-z0-9]/}"
        if [ -n "${token}" ]; then
            REQUESTED_SERVICES+=("${token}")
        fi
    done
fi

SUPABASE_ARGS=(start --workdir "${PROJECT_DIR}" -o env)

if [ ${#REQUESTED_SERVICES[@]} -gt 0 ]; then
    for service in "${KNOWN_SERVICES[@]}"; do
        if ! contains "${service}" "${REQUESTED_SERVICES[@]}"; then
            SUPABASE_ARGS+=(--exclude "${service}")
        fi
    done
fi

SUPABASE_ARGS+=("${PASSTHROUGH[@]}")

log "Starting Supabase stack (workdir: ${PROJECT_DIR})"
supabase "${SUPABASE_ARGS[@]}"

end_ts=$((SECONDS + WAIT_TIMEOUT))
while (( SECONDS < end_ts )); do
    if supabase status --workdir "${PROJECT_DIR}" >/dev/null 2>&1; then
        log "Supabase stack is healthy."
        exit 0
    fi
    sleep "${WAIT_INTERVAL}"
done

log "Timed out after ${WAIT_TIMEOUT}s waiting for Supabase to report healthy status."
exit 1
