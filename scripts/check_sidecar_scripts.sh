#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
status_src="${repo_root}/scripts/sidecars-status.sh"
watch_src="${repo_root}/scripts/sidecars-watch.sh"

status_targets=$(git -C "${repo_root}" ls-files 'templates/**/scripts/sidecars-status.sh')
watch_targets=$(git -C "${repo_root}" ls-files 'templates/**/scripts/sidecars-watch.sh')

check_file() {
  local src=$1
  local rel=$2
  local ok=0
  while IFS= read -r target; do
    if [ -z "${target}" ]; then
      continue
    fi
    if ! cmp -s "${src}" "${repo_root}/${target}"; then
      echo "[drift] ${target} does not match $(basename "${src}")" >&2
      ok=1
    fi
  done <<<"${rel}"
  return ${ok}
}

status_rel="${status_targets}"
watch_rel="${watch_targets}"

result=0
if [ -n "${status_rel}" ]; then
  check_file "${status_src}" "${status_rel}" || result=1
fi
if [ -n "${watch_rel}" ]; then
  check_file "${watch_src}" "${watch_rel}" || result=1
fi

if [ ${result} -ne 0 ]; then
  echo "[error] Sidecar helper scripts are out of sync. Run \"cp scripts/sidecars-*.sh templates/...\" to update." >&2
fi

exit ${result}
