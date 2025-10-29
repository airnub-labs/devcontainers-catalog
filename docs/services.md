# Service Fragments Catalog

Generated lesson presets can opt into additional Docker Compose services by listing them in the manifest. The generator copies the corresponding fragments into `images/presets/generated/.../services/` so instructors can launch them on demand.

## Redis

- **Compose**: `services/redis/docker-compose.redis.yml`
- **Ports**: 6379 (mapped to host 6379)
- **Usage**: Run `docker compose -f services/docker-compose.redis.yml up -d` from the generated preset directory. Ideal for caching demos or queue backends.

## Supabase

- **Compose**: `services/supabase/docker-compose.supabase.yml`
- **CLI Alternative**: Prefer `supabase start` for managed secrets and parity with hosted Supabase projects.
- **Secrets**: Declare placeholders such as `SUPABASE_SERVICE_ROLE_KEY` in the manifest so Codespaces or local `.env` files can provide real values at runtime.
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

## Working with Fragments

1. Generate a lesson preset: `make gen`.
2. Change into the emitted preset directory, e.g. `cd images/presets/generated/my-school/intro-ai/week02`.
3. Launch services with Docker Compose as needed. Multiple fragments can be combined by passing multiple `-f` flags.
4. Shut down services after class to avoid lingering containers.

Fragments are idempotent: rerunning the generator refreshes files without overwriting instructor changes outside the generated directories.
