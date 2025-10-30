# Temporal Minimal Fragment

Temporalite provides a single-container Temporal deployment with a lightweight UI for workflow exploration. A matching admin
tools fragment is available to surface `tctl` inside the same network when CI flows need to smoke-test namespaces.

## Ports

- 7233 → Temporal gRPC endpoint
- 8081 → Temporal UI (`http://localhost:8081`)

## Workspace Expectations

- No volumes are required for demos. Supply namespace seeds or workflow samples from your lesson scaffold if desired.
- `.env.example` captures the `TEMPORAL_CLI_ADDRESS` and a UI port override so students know how to tunnel Codespaces ports.
- Temporal UI is configured to allow CORS from common localhost ports so local front-ends can interact with the API gateway.
- Add the optional `temporal-admin` profile (see `docker-compose.temporal-admin.yml`) to run `tctl` commands from within the
  aggregate compose bundle. The CLI will respect the profile when generating aggregates.

## Aggregate Compose

When manifests include `temporal`, the generator bundles this fragment. The resulting `aggregate.compose.yml` keeps Temporal and the UI on the shared `devnet` network so other services (e.g., workers) can dial `temporal:7233` without extra configuration.
