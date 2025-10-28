#!/usr/bin/env bash
set -euo pipefail

if [ "{{templateOption.supabaseLocal}}" = "true" ]; then
  if command -v supabase >/dev/null 2>&1; then
    if supabase status >/dev/null 2>&1; then
      echo "[stack] Supabase CLI ready. Use 'supabase start' to launch services when needed." >&2
    else
      echo "[stack] Initialize Supabase with 'supabase init --local' before running 'supabase start'." >&2
    fi
  else
    echo "[stack] Supabase CLI missing; check feature resolution." >&2
  fi
fi
