# Service Fragments Catalog

Generated lesson presets can opt into additional Docker Compose services by listing them in the manifest. The generator copies the corresponding fragments into `images/presets/generated/.../services/` so instructors can launch them on demand.

## Redis

- **Compose**: `services/redis/docker-compose.redis.yml`
- **Ports**: 6379 (mapped to host 6379)
- **Usage**: Run `docker compose -f services/docker-compose.redis.yml up -d` from the generated preset directory. Ideal for caching demos or queue backends.

## Supabase

- **Compose**: `services/supabase/docker-compose.supabase.yml`
- **CLI Alternative**: Prefer `supabase start` for managed secrets and parity with hosted Supabase projects.
- **Secrets**: Declare placeholders such as `SUPABASE_SERVICE_ROLE_KEY` in the manifest so Codespaces or local `.env` files can provide real values at runtime. Copy `.env.example-supabase` to `.env` before launching when you vendor the compose bundle.
- **Docs**: See `services/supabase/README.md` for sync guidance and CLI recommendations.

## Kafka (KRaft)

- **Compose**: `services/kafka/docker-compose.kafka-kraft.yml`
- **Ports**: 9092 (mapped to host 9092)
- **Notes**: Uses a single-node KRaft configuration suitable for demos. Health checks ensure readiness before students connect.

## Kafka Utils

- **Compose**: `services/kafka/docker-compose.kafka-utils.yml`
- **Purpose**: Provides lightweight producer/consumer loops via `kafkacat` to demonstrate topic flow.
- **Dependency**: Requires the Kafka service fragment to be active.

## Inbucket (optional email testing)

- **Compose**: `services/inbucket/docker-compose.inbucket.yml`
- **Ports**: SMTP on 2500, web UI on 9000.
- **Use Cases**: Pair with Supabase auth flows that send transactional emails.

## Prefect (Minimal Server)

- **Compose**: `services/prefect/docker-compose.prefect.yml`
- **Ports**: 4200 (Prefect UI)
- **Workspace**: Mounts `./prefect` to persist CLI profiles. No database needed—ideal for short demos.

## Apache Airflow (SequentialExecutor)

- **Compose**: `services/airflow/docker-compose.airflow.yml`
- **Ports**: 8080 (Airflow UI)
- **Workspace**: Bind-mounts `./airflow` so DAGs live beside the generated preset. A default admin user (`admin` / `admin`) is created at boot.

## Dagster (dagster dev)

- **Compose**: `services/dagster/docker-compose.dagster.yml`
- **Ports**: 3000 (Dagster UI)
- **Workspace**: Mounts `./dagster` and runs `dagster dev` against `workspace.yaml`, matching the lesson scaffold defaults.

## Temporal (Temporalite + UI)

- **Compose**: `services/temporal/docker-compose.temporal.yml`
- **Ports**: 7233 (gRPC), 8081 (Temporal UI)
- **Workspace**: Single Temporalite container plus UI, safe for Codespaces and laptops. Health checks gate the UI until Temporalite is serving.

Each fragment ships with a README describing expectations and how the aggregate compose bundles them. The generator copies these READMEs into the preset so instructors know what ports are in play when enabling multiple orchestrators together.

## Working with Fragments

1. Generate a lesson preset: `make gen`.
2. Change into the emitted preset directory, e.g. `cd images/presets/generated/my-school-intro-ai-week02-prompts`.
3. Launch services with Docker Compose as needed. Multiple fragments can be combined by passing multiple `-f` flags, or by running the generated `docker-compose.classroom.yml` aggregate file when the manifest sets `emit_aggregate_compose: true` (default).
4. Shut down services after class to avoid lingering containers.

Fragments are idempotent: rerunning the generator refreshes files without overwriting instructor changes outside the generated directories.

## Aggregate Compose — one-liner

From a Lesson Manifest:

```bash
devc generate examples/lesson-manifests/intro-ai-week02.yaml \
  --out images,preset,templates,scaffold

# Start the full stack declared in the manifest (redis/supabase/kafka/etc.)
docker compose -f aggregate.compose.yml up -d
```

This works locally and in Codespaces the same way (no secrets baked; use .env or Codespaces secrets).

---
