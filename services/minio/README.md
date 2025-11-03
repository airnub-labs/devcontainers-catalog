# MinIO Fragment

This fragment launches a single-node MinIO object storage server with the web console enabled. It is intended for S3-compatible development workflows such as testing upload flows, practicing bucket policies, or providing scratch storage for data engineering lessons.

## Quickstart

```bash
docker compose -f docker-compose.minio.yml up
```

Then open <http://localhost:9001> to access the MinIO Console.

## Ports

- `${MINIO_API_PORT:-9000}` → S3-compatible API endpoint (`http://localhost:${MINIO_API_PORT:-9000}`)
- `${MINIO_CONSOLE_PORT:-9001}` → Web console (`http://localhost:${MINIO_CONSOLE_PORT:-9001}`)

## Credentials

By default the server uses `minioadmin` / `minioadmin`. Override the following environment variables in a `.env` file when you need custom credentials or want to disable the console redirect:

- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_BROWSER_REDIRECT_URL`

## Usage Tips

- The data directory is backed by the `minio-data` volume; remove or swap to a `tmpfs` mount when you want each session to start fresh.
- Inside generated aggregates, reference the service as `http://minio:9000` rather than binding to localhost-specific ports.
- Healthchecks hit `/minio/health/live`, ensuring dependent services wait until MinIO is ready before attempting bucket operations.

## Aggregate Compose

Listing `minio` in `spec.services` copies this fragment into `aggregate.compose.yml`, giving workspaces a consistent S3-compatible endpoint in both local Docker and Codespaces environments.
