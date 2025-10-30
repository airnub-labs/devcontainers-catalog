#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FILES=()
# Core? none by default; this script only aggregates requested fragments.
[[ "${REDIS:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/redis/docker-compose.redis.yml")
[[ "${SUPABASE:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/supabase/docker-compose.supabase.yml")
[[ "${KAFKA:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/kafka/docker-compose.kafka-kraft.yml")
[[ "${AIRFLOW:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/airflow/docker-compose.airflow.yml")
[[ "${PREFECT:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/prefect/docker-compose.prefect.yml")
[[ "${DAGSTER:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/dagster/docker-compose.dagster.yml")
[[ "${TEMPORAL:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/temporal/docker-compose.temporal.yml" "$ROOT_DIR/services/temporal/docker-compose.temporal-admin.yml")
[[ "${WEBTOP:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/webtop/docker-compose.webtop.yml")
[[ "${CHROME_CDP:-0}" == "1" ]] && FILES+=("$ROOT_DIR/services/chrome-cdp/docker-compose.chrome-cdp.yml")

if [[ "${#FILES[@]}" -eq 0 ]]; then
  echo "[info] No fragments requested; set env flags like KAFKA=1 REDIS=1 ..." >&2
  exit 0
fi

echo "[info] Bringing up $((${#FILES[@]})) fragments..."
docker compose $(printf ' -f %q' "${FILES[@]}") up -d
