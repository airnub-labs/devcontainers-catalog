#!/usr/bin/env bash
set -euo pipefail

SCAFFOLD="{{templateOption.scaffold}}"
NEXT_VERSION="{{templateOption.nextVersion}}"
USE_TS="{{templateOption.ts}}"
USE_APP_ROUTER="{{templateOption.appRouter}}"
USE_AUTH="{{templateOption.auth}}"

if [ "${SCAFFOLD}" = "true" ] && [ ! -f package.json ]; then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "[nextjs-supabase] pnpm is required to scaffold the project." >&2
    exit 1
  fi

  TS_FLAG=$([ "${USE_TS}" = "true" ] && echo "--ts" || echo "--js")
  APP_FLAG=$([ "${USE_APP_ROUTER}" = "true" ] && echo "--app" || echo "--pages")

  pnpm dlx create-next-app@"${NEXT_VERSION}" \
    ${TS_FLAG} \
    ${APP_FLAG} \
    --use-pnpm \
    --no-tailwind \
    --eslint \
    --src-dir \
    --import-alias "@/*" \
    .

  pnpm add @supabase/supabase-js
  if [ "${USE_AUTH}" = "true" ]; then
    pnpm add @supabase/auth-helpers-nextjs @supabase/ssr
  fi
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile || pnpm install
fi

if [ -f package.json ]; then
  node <<'NODE'
const fs = require('fs');
const pkgPath = 'package.json';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.scripts && typeof pkg.scripts.dev === 'string' && !pkg.scripts.dev.includes('--hostname')) {
    pkg.scripts.dev = pkg.scripts.dev.replace(/next dev(?![^]*--hostname)/, 'next dev --hostname 0.0.0.0');
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
} catch (error) {
  console.warn('[nextjs-supabase] Unable to update dev script hostname:', error);
}
NODE
fi
