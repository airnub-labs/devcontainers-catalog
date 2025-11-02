# Orchestrator Stack Guide

Choose the orchestrator that best matches your lesson outcomes, then opt into it via the Lesson Manifest (`spec.services`). Each option ships with a matching base preset and Compose fragment so the generator can materialize a classroom-ready stack.

## Quick Compare

| Stack     | Preset (`spec.base_preset`) | Default Ports | Ideal For |
|-----------|-----------------------------|---------------|-----------|
| Prefect   | `python-prefect`            | 4200 (UI)     | Flow orchestration labs with modern Python projects |
| Airflow   | `python-airflow`            | 8080 (UI)     | DAG authoring, scheduling fundamentals, ETL pipelines |
| Dagster   | `python-dagster`            | 3000 (UI)     | Data platform courses exploring asset graphs and type-aware orchestration |
| Temporal  | `ts-temporal`               | 7233 (gRPC), 8080 (UI) | Polyglot workflow demos and TypeScript client exercises |

All presets extend `mcr.microsoft.com/devcontainers/base:ubuntu-24.04` and rely on Dev Container Features for tooling so they remain fast to prebuild.

## How the Aggregate Compose Works

When a manifest lists orchestrator services (or any service fragments) the generator:

1. Copies each fragment into `images/presets/generated/<lesson-slug>/services/<service>/`.
2. Copies any `.env.example` files to the build context as `.env.example-<service>` so you can stage secrets safely.
3. Merges all selected fragments into `docker-compose.classroom.yml` and emits `README-SERVICES.md` with launch commands.

Instructors can then bring the entire stack up with:

```bash
docker compose -f docker-compose.classroom.yml up -d
```

This aggregate file preserves a shared `classroom` Docker network so services resolve each other exactly the same in local Docker and Codespaces.

## Customising Your Stack

- **Add more services**: Update the manifest with additional entries (e.g. `redis`, `supabase`). The generator re-merges everything.
- **Override ports**: Edit the copied compose fragments inside `images/presets/generated/.../services/<service>/` before running `docker compose`. Re-run the generator after committing customisations so changes persist.
- **Extend presets**: Start from the suggested preset, then layer extra Dev Container Features in the manifest’s `spec.features` block if a course requires more tooling.

## Multi-arch Reminder

Run `make lesson-push` (or rely on the `publish-lesson-images` workflow) to build lesson images for `linux/amd64` and `linux/arm64`. Codespaces and modern student laptops span both architectures, so multi-arch pushes keep launch times consistent.
