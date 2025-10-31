# Airflow Minimal Fragment

![stability: experimental](https://img.shields.io/badge/stability-experimental-orange)

> **Experimental**: Hidden by default in SDK/CLI. APIs, ports, and behavior may change. Enable with `--include-experimental` or `DEVC_INCLUDE_EXPERIMENTAL=1`.

This fragment launches a single Airflow webserver backed by the SequentialExecutor and SQLite. It is optimized for demos and lessons where instructors want to showcase DAG authoring without standing up Celery or external metadata stores.

## Quickstart

```bash
docker compose -f docker-compose.airflow.yml up
```

## Ports

- 8080 → Airflow UI (`http://localhost:8080`)

## Workspace Expectations

- Mounts `./airflow` into `/opt/airflow` so you can add DAGs, plugins, or a `requirements.txt` from the generated preset/workspace.
- Creates an admin user (`admin` / `admin`) during startup; override via environment variables if needed.
- `.env.example` records the demo credentials and Fernet key placeholder so teams know which secrets to rotate before production.
- Healthchecks poll `http://localhost:8080/health`; wait for a `healthy` status before running DAGs.

## Aggregate Compose

When a lesson manifest lists `airflow` in `spec.services`, the generator copies this fragment into the preset bundle and merges it into `aggregate.compose.yml`. Profiles allow toggling services so instructors can launch Airflow alongside other stacks without port collisions.
