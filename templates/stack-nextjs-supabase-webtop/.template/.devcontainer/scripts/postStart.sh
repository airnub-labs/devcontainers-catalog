#!/usr/bin/env bash
set -euo pipefail

if [ "{{templateOption.supabaseLocal}}" = "true" ]; then
  if command -v supabase >/dev/null 2>&1; then
    if [ -f supabase/config.toml ] || [ -f .supabase/config.toml ]; then
      echo "[stack] Supabase config detected. You can run 'supabase start' to launch the local stack." >&2
    else
      echo "[stack] Run 'supabase init' followed by 'supabase start' to bring up the local services." >&2
    fi
  else
    echo "[stack] Supabase CLI feature not detected; ensure features resolved correctly." >&2
  fi
fi
