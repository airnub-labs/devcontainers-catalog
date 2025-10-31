# Supabase Service Fragment

Supabase-backed lessons can either rely on the official Supabase CLI or use a vendored docker compose stack. This folder documents both approaches so the generator and downstream templates can remain idempotent.

## Quickstart

```bash
docker compose -f docker-compose.supabase.yml up
```

## Preferred: Supabase CLI

1. Install the Supabase CLI in your image or template (for example via `npm install -g supabase`).
2. In your lesson preset, add a `postStartCommand` or document a manual step to run `supabase start` inside the container.
3. The CLI provisions and tears down the local stack, managing passwords and ports automatically.

This keeps the catalog lightweight and delegates lifecycle to the CLI while still enabling the same experience in Codespaces and locally.

## Vendored Compose (optional)

For offline or audited environments, you can vendor the upstream compose bundle. Keep the files in sync with <https://github.com/supabase/supabase/tree/master/docker>. The placeholder compose below mirrors the core services (studio, rest, realtime, db) and is safe to copy into generated presets.

To use it, merge the fragment alongside your generated preset and launch with `docker compose -f services/docker-compose.supabase.yml up`. Copy `.env.example-supabase` to `.env` (or rely on Codespaces secrets) before starting so passwords never ship in Git history.

Because Supabase relies on numerous secrets, manifests should list placeholders in `spec.secrets_placeholders` so instructors remember to supply them via Codespaces secrets or `.env` files. The compose file reads credentials from environment variables (see `.env.example-supabase`) and falls back to development defaults when values are not provided.
