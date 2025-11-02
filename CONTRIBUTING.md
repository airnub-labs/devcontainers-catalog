# Contributing to the Devcontainers Catalog

Thank you for helping build the chat-to-classroom platform! This repository hosts the reusable features, templates, images, services, and schemas that power instructor-led lesson environments. The guidelines below keep contributions deterministic, reproducible, and aligned with our SaaS roadmap.

## Before You Start

1. **Review the docs**
   - [Catalog Design](docs/architecture/catalog-design.md) for structure and lifecycle expectations
   - [Development Setup](docs/contributing/development.md) for local setup and tooling
   - [Security Policy](SECURITY.md) for vulnerability and secret handling policies
   - [MCP Contract](docs/architecture/agents-mcp-contract.md) for SaaS integration contracts
2. **Pick or file an issue**
   - Use the provided issue templates to outline the problem, manifest impact, and acceptance criteria.
   - For new ideas, highlight how the change helps instructors go from chat to classroom faster.
3. **Discuss breaking changes early**
   - Schema changes, renamed images, or template removals require a migration plan captured in `docs/MIGRATION*.md`.

## Prerequisites

Run `make check` before opening a pull request. The target fans out into schema validation, generator dry-runs, JavaScript unit tests, shell linting, and optional Docker Compose validation, so having the following tooling locally keeps the loop fast:

| Tool | Version | Purpose in `make check` | Install tips |
| --- | --- | --- | --- |
| Python | 3.11+ | Executes `scripts/validate_lessons.py`, `scripts/manifest_slug.py`, and the generator module (`make gen-all`). | `pipx install pipenv` then `pipenv install --python 3.11`, or use the repo devcontainer where Python is preinstalled. |
| Python deps | `pyyaml`, `jsonschema` | Required by the validation scripts. | `pip install "pyyaml>=6" "jsonschema>=4"` (can be done in a virtualenv). |
| Node.js + npm | Node 24+, npm 10+ | Installs and runs the `tools/airnub-devc` unit tests when available. | Use `nvm install 24 && nvm use 24`, or install Node via your package manager (Homebrew, asdf, etc.). |
| jq / yq | Latest | Surface manifest lint warnings early. | `brew install jq yq`, `apt-get install jq`, and `pipx install yq`. |
| shellcheck | 0.9+ | Lints all tracked shell scripts. | `brew install shellcheck` or `apt-get install shellcheck`. |
| Docker CLI + Docker Compose | 24+ | Validates generated `docker-compose.classroom.yml` bundles when Docker is available. | Install Docker Desktop, Rancher Desktop, or `apt-get install docker.io docker-compose-plugin`. |

Partial runs are supported. If `make check` cannot find npm, shellcheck, or Docker on your `PATH`, it will skip those steps and emit a warning rather than fail the run. This is handy when working on a laptop without Docker; keep full validation in CI for parity.

## Development Environment

1. **Clone and install tooling**
   ```bash
   git clone https://github.com/airnub-labs/devcontainers-catalog.git
   cd devcontainers-catalog
   make install-tools
   ```
2. **Use devcontainers**
   - Open the repo in VS Code Dev Containers or GitHub Codespaces for a consistent toolchain.
   - Run `make lint` and `make test` locally before opening a PR.
3. **Follow feature/image guidelines**
   - Installers must be idempotent and avoid background daemons.
   - Never embed secrets. Use placeholders and document expected environment variables.
   - Templates should remain repo-agnostic and ready for the SaaS generator to consume.

## Pull Request Process

1. **Branch and scope**
   - Use descriptive branches (e.g. `feature/add-supabase-service`).
   - Keep changes focused; independent improvements should ship in separate PRs.
2. **Update documentation**
   - When behaviour changes, update the authoritative docs in `docs/` as part of the PR.
   - Capture verification evidence in `VARIFY.md` if you add or modify validation steps.
3. **Testing expectations**
   - Add or update automated tests in `features/`, `templates/`, or `scripts/` as appropriate.
   - For images, run smoke tests (`make smoke-tests`) and add new services to `compose_aggregate.sh` when required.
4. **Security hygiene**
   - Run `make trivy` (or check the CI output) to confirm images are free of known CVEs.
   - Dependabot alerts must be resolved promptly; do not merge PRs with failing security checks.
5. **PR checklist**
   - Fill out the pull request template completely.
   - Reference linked issues and note manifest or schema impact.
   - Include logs demonstrating deterministic outputs where relevant.

## After Merge

- Confirm CI pipelines are green on `main`.
- Watch for Dependabot PRs and coordinate releases to keep student environments up to date.
- Celebrate! Your contribution helps instructors deliver rich classroom experiences through a single chat prompt.

For any questions, reach out to the maintainers listed in [MAINTAINERS.md](docs/contributing/maintainers.md).
