# Service Fragments

This directory hosts reusable Docker Compose fragments that the catalog generator can merge into lesson-specific aggregates. Each fragment focuses on a single dependency (database, UI helper, queue, etc.) so manifests can opt-in to only the services they need while keeping local/Codespaces parity.

Most fragments expose a single `docker-compose.<service>.yml` file that is copied into generated workspaces when `spec.services` lists the matching slug. Some services also ship with supporting assets (sample repos, seed data, or helper containers) that sit alongside the Compose file.

| Service | Compose file(s) | Summary |
| --- | --- | --- |
| airflow | `docker-compose.airflow.yml` | Minimal Airflow webserver for DAG demos. |
| chrome-cdp | `docker-compose.chrome-cdp.yml` | Remote-headless Chrome with the DevTools Protocol. |
| dagster | `docker-compose.dagster.yml` | Dagster orchestration stack and example repo. |
| inbucket | `docker-compose.inbucket.yml` | Disposable SMTP/IMAP/Web UI mail sandbox. |
| kafka | `docker-compose.kafka-kraft.yml`, `docker-compose.kafka-utils.yml` | Single-node Kafka (KRaft) plus optional kafkacat helpers. |
| linux-chrome | `docker-compose.linux-chrome.yml` | VNC-accessible Linux desktop running Chrome. |
| prefect | `docker-compose.prefect.yml` | Prefect server with agent for flow development. |
| redis | `docker-compose.redis.yml` | Standalone Redis for caching or queues. |
| supabase | `docker-compose.supabase.yml` | Supabase stack (Postgres, auth, storage, realtime). |
| temporal | `docker-compose.temporal.yml`, `docker-compose.temporal-admin.yml` | Temporal workflow engine and optional admin tools. |
| webtop | `docker-compose.webtop.yml` | Full Linux desktop in the browser for GUI workflows. |

## Using fragments

1. Define the service slug in a lesson manifest (for example, `"redis"`).
2. The generator copies the corresponding Compose file into the preset bundle.
3. When students run `docker compose -f aggregate.compose.yml up`, the fragment launches alongside other requested services.

Fragments expect secrets or long-lived credentials to flow via environment variables or `.env` files provided by instructors—none are baked into the images. Adjust exposed ports with the documented `${VAR:-default}` overrides when you need to avoid collisions.
