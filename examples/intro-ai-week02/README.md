# Intro AI Week 02 Example Walkthrough

This example mirrors the CI smoke flow for a lesson manifest. It shows how the catalog manifest, preset build context, scaffold,
and aggregate compose file line up.

## 1. Manifest

The manifest lives alongside this README: [`manifest.yaml`](./manifest.yaml). It selects the `python-prefect` preset and adds
Prefect, Airflow, Dagster, and Temporal service fragments.

## 2. Generate artifacts

```bash
# Validate the manifest
npx @airnub/devc validate examples/intro-ai-week02/manifest.yaml

# Emit preset + scaffold directories
npx @airnub/devc generate examples/intro-ai-week02/manifest.yaml \
  --out-images images/presets/generated \
  --out-templates templates/generated \
  --force
```

Generation produces:

```
images/presets/generated/airnub-intro-ai-week02/
  aggregate.compose.yml
  devcontainer.json
  services/
    airflow/
    dagster/
    prefect/
    temporal/

templates/generated/airnub-intro-ai-week02/
  .devcontainer/
    aggregate.compose.yml
    devcontainer.json
    services/
      airflow/
      dagster/
      prefect/
      temporal/
```

## 3. Build (offline friendly)

```bash
npx @airnub/devc build \
  --ctx images/presets/generated/airnub-intro-ai-week02 \
  --tag ghcr.io/airnub-labs/templates/lessons/airnub-intro-ai-week02:ubuntu-24.04-airnub-intro-ai-week02-v1 \
  --oci-output dist/cli-e2e \
  --manifest examples/intro-ai-week02/manifest.yaml \
  --version v1
```

This writes an OCI archive to `dist/cli-e2e/` when you do not want to push to a registry.

## 4. Smoke the aggregate compose

```bash
docker compose -f images/presets/generated/airnub-intro-ai-week02/aggregate.compose.yml up -d --wait
docker compose -f images/presets/generated/airnub-intro-ai-week02/aggregate.compose.yml ps
docker compose -f images/presets/generated/airnub-intro-ai-week02/aggregate.compose.yml down
```

The generated compose file includes the metadata block used by `devc sync`:

```yaml
x-airnub-devc:
  services:
    - prefect
    - airflow
    - dagster
    - temporal
  network: devnet
```

Commit this README whenever you update the manifest so contributors can follow the exact golden path locally.
