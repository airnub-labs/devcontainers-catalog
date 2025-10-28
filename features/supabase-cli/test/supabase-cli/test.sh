#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
    echo "supabase CLI not found" >&2
    exit 1
fi

supabase --version >/dev/null 2>&1
