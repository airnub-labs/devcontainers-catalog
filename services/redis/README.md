# Redis Fragment

This fragment provides a single Redis 7.2 instance optimized for development workloads such as caching, session storage, or lightweight queues.

## Ports

- `6379` → Redis TCP endpoint (`redis://localhost:6379`)

## Usage Tips

- The container starts with `redis-server --save 60 1` so RDB snapshots occur if at least one write happens within 60 seconds; adjust the command for entirely in-memory workflows.
- Connect to `redis:6379` from other services within the Compose network to avoid relying on host ports.
- Healthchecks use `redis-cli ping`, ensuring the service is ready before dependent containers attempt to connect.

## Aggregate Compose

Listing `redis` in `spec.services` copies this fragment into `aggregate.compose.yml`, ensuring workspaces get a consistent Redis endpoint locally and in Codespaces.
