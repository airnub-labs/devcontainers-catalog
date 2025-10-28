#!/usr/bin/env bash
set -euo pipefail

if [ "{{templateOption.supabaseLocal}}" = "true" ]; then
  if command -v supabase >/dev/null 2>&1; then
    if [ -f supabase/config.toml ] || [ -f .supabase/config.toml ]; then
      echo "[stack] Supabase config detected. Run 'supabase start' when you're ready." >&2
    else
      echo "[stack] Initialize Supabase with 'supabase init' before running 'supabase start'." >&2
    fi
  else
    echo "[stack] Supabase CLI not found; verify the feature installation." >&2
  fi
fi
