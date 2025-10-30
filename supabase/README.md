# Supabase workspace helpers

The `supabase/bin/supabase-up.sh` script wraps `supabase start` with safe argument parsing and checksum-friendly environment loading. It avoids `eval`, filters `.env` entries to trusted `KEY=VALUE` pairs, and waits for the local stack to become healthy before returning. Use it whenever you need to boot the shared Supabase services from the meta workspace:

```bash
./supabase/bin/supabase-up.sh --services db,auth,rest
```

The helper accepts `--env-file`, `--project-dir`, and passthrough arguments after `--` to forward additional flags directly to `supabase start`.
