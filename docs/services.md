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

## Prefect

- **Compose**: `services/prefect/docker-compose.prefect.yml`
- **Ports**: 4200 (Prefect UI)
- **Env template**: Copy `.env.example-prefect` to `.env` to override API host or auth tokens.
- **Notes**: Runs the Prefect 2 server; students can register flows from the generated lesson workspace.

## Apache Airflow

- **Compose**: `services/airflow/docker-compose.airflow.yml`
- **Ports**: 8080 (Airflow UI)
- **Env template**: `.env.example-airflow` seeds admin credentials; copy to `.env` before launch.
- **Persistence**: Named volumes store DAGs, logs, and Postgres data so the scheduler keeps history between restarts.

## Dagster

- **Compose**: `services/dagster/docker-compose.dagster.yml`
- **Ports**: 3000 (Dagster UI)
- **Env template**: `.env.example-dagster` documents where to place pipeline-specific variables.
- **Project scaffold**: `services/dagster/example_dagster_repo/` is a placeholder repo—replace it with the lesson’s Dagster project or mount a dedicated repository.

## Temporal

- **Compose**: `services/temporal/docker-compose.temporal.yml`
- **Ports**: 7233 (gRPC), 8080 (Temporal UI)
- **Env template**: `.env.example-temporal` exposes CORS overrides when you integrate custom front ends.
- **Notes**: Uses Temporal’s auto-setup image with Postgres backing storage for a production-like control plane.

## Working with Fragments

1. Generate a lesson preset: `make gen`.
2. Change into the emitted preset directory, e.g. `cd images/presets/generated/my-school-intro-ai-week02-prompts`.
3. Launch services with Docker Compose as needed. Multiple fragments can be combined by passing multiple `-f` flags, or by running the generated `docker-compose.classroom.yml` aggregate file when the manifest sets `emit_aggregate_compose: true` (default).
4. Shut down services after class to avoid lingering containers.

Fragments are idempotent: rerunning the generator refreshes files without overwriting instructor changes outside the generated directories.
