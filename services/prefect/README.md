# Prefect Minimal Fragment

Runs Prefect Server 2.x in a single container so flows can be registered and viewed without needing an external database or API key setup.

## Quickstart

```bash
docker compose -f docker-compose.prefect.yml up
```

## Ports

- 4200 → Prefect UI (`http://localhost:4200`)

## Workspace Expectations

- Mounts `./prefect` into `/root/.prefect` to persist profiles, API keys, and flow storage between restarts.
- Defaults to non-debug mode; override environment variables in the generated preset if you need verbose logging.
- `.env.example` points at the in-cluster API endpoint and logging level so local vs. Codespaces URLs stay in sync.

## Aggregate Compose

When manifests include `prefect`, the generator copies this fragment and merges it into `aggregate.compose.yml`. Prefect runs on the same private network as other services so flows can call Redis, Supabase, etc. without additional wiring.
