#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 [options] [fragment ...]

Options:
  -o, --output <file>   Path to write the merged compose file (default: aggregate.compose.yml)
  --up                  Run docker compose up -d after writing the file
  -h, --help            Show this message

Examples:
  $0 services/redis/docker-compose.redis.yml services/prefect/docker-compose.prefect.yml
  REDIS=1 PREFECT=1 $0
USAGE
}

OUTPUT="aggregate.compose.yml"
BRING_UP=0
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRAGMENTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)
      OUTPUT="$2"
      shift 2
      ;;
    --up)
      BRING_UP=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      FRAGMENTS+=("$1")
      shift
      ;;
  esac
done

if [[ ${#FRAGMENTS[@]} -eq 0 ]]; then
  [[ "${REDIS:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/redis/docker-compose.redis.yml")
  [[ "${SUPABASE:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/supabase/docker-compose.supabase.yml")
  [[ "${KAFKA:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/kafka/docker-compose.kafka-kraft.yml")
  [[ "${AIRFLOW:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/airflow/docker-compose.airflow.yml")
  [[ "${PREFECT:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/prefect/docker-compose.prefect.yml")
  [[ "${DAGSTER:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/dagster/docker-compose.dagster.yml")
  [[ "${TEMPORAL:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/temporal/docker-compose.temporal.yml")
  [[ "${WEBTOP:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/webtop/docker-compose.webtop.yml")
  [[ "${CHROME_CDP:-0}" == "1" ]] && FRAGMENTS+=("$ROOT_DIR/services/chrome-cdp/docker-compose.chrome-cdp.yml")
fi

if [[ ${#FRAGMENTS[@]} -eq 0 ]]; then
  echo "[error] No fragments provided" >&2
  usage
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

docker compose $(printf ' -f %q' "${FRAGMENTS[@]}") config >"$tmpdir/combined.yml"

install -d "$(dirname "$OUTPUT")"
cp "$tmpdir/combined.yml" "$OUTPUT"

echo "[ok] aggregate compose written to $OUTPUT"

if [[ $BRING_UP -eq 1 ]]; then
  docker compose -f "$OUTPUT" up -d
fi
