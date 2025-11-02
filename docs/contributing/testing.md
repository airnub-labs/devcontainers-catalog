# Testing Guidelines

**Navigation:** [Documentation Hub](../README.md) > [Contributing](./README.md) > Testing

> Testing standards and procedures for the Airnub DevContainers Catalog

---

## Overview

Testing ensures the catalog's features, templates, and images work reliably across different environments. We use a multi-layered testing approach:

- **Schema validation** - Ensure manifests and configs are valid
- **Feature tests** - Verify features install correctly
- **Template tests** - Smoke test templates materialize properly
- **Image builds** - Confirm images build and run
- **Integration tests** - Test service combinations
- **E2E tests** - Full workflow validation

---

## Testing Checklist

Before submitting a PR:

- [ ] Schema validation passes
- [ ] Feature installs idempotently
- [ ] Template smoke test succeeds
- [ ] Image builds successfully (multi-arch)
- [ ] Services start and respond to health checks
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added

---

## Schema Validation

### Manifest Validation

```bash
# Validate a single manifest
devc validate examples/lesson-manifests/intro-ai-week02.yaml

# Validate all manifests
find examples/lesson-manifests -name "*.yaml" -exec devc validate {} \\;
```

### JSON Schema Validation

```bash
# Validate against schema
cd packages/schema
npm test

# Or with pnpm
pnpm test
```

---

## Feature Testing

### Test Feature Installation

```bash
# Test feature in isolation
cd features/supabase-cli
devcontainer features test

# Test specific scenarios
devcontainer features test --scenario minimal
devcontainer features test --scenario with-postgres
```

### Feature Test Structure

```
features/supabase-cli/
├── devcontainer-feature.json
├── install.sh
└── test/
    ├── minimal/
    │   ├── devcontainer.json
    │   └── test.sh
    └── with-postgres/
        ├── devcontainer.json
        └── test.sh
```

### Writing Feature Tests

```bash
#!/bin/bash
# test/minimal/test.sh

set -e

# Test installation
supabase --version || exit 1

# Test idempotence (run install script again)
bash /tmp/install.sh || exit 1
supabase --version || exit 1

# Test functionality
supabase init --force
supabase status || exit 1

echo "✅ Feature test passed"
```

### Feature Test Best Practices

**✅ DO:**
- Test idempotence (run install twice)
- Test different base images
- Verify no long-running daemons
- Check exit codes
- Test with minimal and full scenarios

**❌ DON'T:**
- Assume network connectivity
- Leave running processes
- Hard-code paths
- Skip error checking

---

## Template Testing

### Smoke Test Templates

```bash
# Test single template
cd templates/stack-nextjs-supabase-webtop
devcontainer build --workspace-folder .

# Test all templates
npm run test:templates
```

### Template Test Workflow

1. **Build the template:**
   ```bash
   devcontainer build --workspace-folder templates/stack-nextjs-supabase-webtop
   ```

2. **Start containers:**
   ```bash
   docker compose -f templates/stack-nextjs-supabase-webtop/.devcontainer/docker-compose.yml up -d
   ```

3. **Verify services:**
   ```bash
   # Redis
   redis-cli ping

   # Supabase
   curl http://localhost:54321/health

   # Webtop
   curl http://localhost:6080
   ```

4. **Cleanup:**
   ```bash
   docker compose down -v
   ```

---

## Image Build Testing

### Build Multi-Arch Images

```bash
# Build with devc CLI
devc build --ctx images/presets/full \\
  --tag ghcr.io/airnub-labs/devcontainer-images/dev-full:test

# Build with buildx directly
docker buildx build --platform linux/amd64,linux/arm64 \\
  -t ghcr.io/airnub-labs/devcontainer-images/dev-full:test \\
  --provenance=false \\
  images/presets/full
```

### Test Image

```bash
# Run container from image
docker run --rm -it ghcr.io/airnub-labs/devcontainer-images/dev-full:test bash

# Inside container, verify tools
node --version
pnpm --version
python3 --version
```

### Image Test Checklist

- [ ] Multi-arch build succeeds (amd64 + arm64)
- [ ] Image size is reasonable (< 2GB for base images)
- [ ] All expected tools are installed
- [ ] Tools have correct versions
- [ ] OCI labels are present
- [ ] No security vulnerabilities (run `docker scan`)

---

## Integration Testing

### Test Service Combinations

```bash
# Generate from manifest with multiple services
devc generate examples/lesson-manifests/fullstack-app.yaml \\
  --out-images ./test/images \\
  --out-templates ./test/templates

# Build image
devc build --ctx ./test/images/airnub-fullstack-app \\
  --tag test:fullstack-app

# Scaffold workspace
devc scaffold examples/lesson-manifests/fullstack-app.yaml \\
  --out ./test/workspaces/fullstack-app

# Start all services
cd ./test/workspaces/fullstack-app
docker compose -f aggregate.compose.yml up -d

# Wait for services to be ready
sleep 30

# Run health checks
./scripts/health-check.sh

# Cleanup
docker compose -f aggregate.compose.yml down -v
```

### Integration Test Script

```bash
#!/bin/bash
# scripts/integration-test.sh

set -e

MANIFEST=$1
WORKSPACE=./test/workspace-$$

echo "Testing manifest: $MANIFEST"

# Generate
devc generate "$MANIFEST" \\
  --out-images ./test/images \\
  --out-templates ./test/templates \\
  --force

# Scaffold
devc scaffold "$MANIFEST" --out "$WORKSPACE"

# Build dev container
cd "$WORKSPACE"
devcontainer build --workspace-folder .

# Start services
docker compose -f aggregate.compose.yml up -d

# Wait for services
sleep 30

# Health checks
redis-cli ping || { echo "❌ Redis failed"; exit 1; }
curl -f http://localhost:54321/health || { echo "❌ Supabase failed"; exit 1; }

# Cleanup
docker compose -f aggregate.compose.yml down -v
cd ../..
rm -rf "$WORKSPACE"

echo "✅ Integration test passed"
```

---

## End-to-End Testing

### E2E Test Workflow

```bash
# Full workflow: manifest → image → workspace → test
#!/bin/bash

set -e

LESSON=intro-ai-week02
MANIFEST=examples/lesson-manifests/$LESSON.yaml

# 1. Validate
devc validate "$MANIFEST"

# 2. Generate
devc generate "$MANIFEST" \\
  --out-images images/presets/generated \\
  --out-templates templates/generated

# 3. Build image
devc build --ctx images/presets/generated/airnub-$LESSON \\
  --tag ghcr.io/airnub-labs/templates/lessons/$LESSON:test

# 4. Scaffold workspace
devc scaffold "$MANIFEST" --out workspaces/test-$LESSON

# 5. Open in Dev Container (manual)
code workspaces/test-$LESSON

# 6. Verify in container
# (manual: check tools, services, etc.)

# 7. Cleanup
rm -rf workspaces/test-$LESSON
```

---

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test-features.yml
name: Test Features

on:
  pull_request:
    paths:
      - 'features/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Test features
        run: |
          cd features
          for feature in */; do
            echo "Testing $feature"
            cd "$feature"
            devcontainer features test || exit 1
            cd ..
          done
```

### Local CI Simulation

```bash
# Run same tests as CI locally
act pull_request

# Or manually replicate CI steps
./scripts/test-all.sh
```

---

## Performance Testing

### Build Time Benchmarks

```bash
# Measure build time
time devcontainer build --workspace-folder templates/stack-nextjs-supabase-webtop

# Compare with/without cache
docker builder prune -a
time devcontainer build --workspace-folder templates/stack-nextjs-supabase-webtop
```

### Container Startup Time

```bash
# Measure cold start
time docker compose up -d

# Measure warm start (after images pulled)
docker compose down
time docker compose up -d
```

---

## Testing Tools

### Required Tools

```bash
# Dev Containers CLI
npm install -g @devcontainers/cli

# Docker Buildx
docker buildx version

# devc CLI
npm install -g @airnub/devc

# jq (for JSON parsing)
brew install jq  # macOS
apt-get install jq  # Ubuntu
```

### Helpful Scripts

#### Bulk Test Manifests

```bash
#!/bin/bash
# scripts/test-all-manifests.sh

for manifest in examples/lesson-manifests/*.yaml; do
  echo "Testing $manifest"
  devc validate "$manifest" || exit 1
done
```

#### Health Check All Services

```bash
#!/bin/bash
# scripts/health-check-all.sh

echo "Redis:" && redis-cli ping
echo "Supabase:" && curl -sf http://localhost:54321/health | jq '.status'
echo "Kafka:" && docker exec kafka-dev kafka-topics --list --bootstrap-server localhost:9092
echo "Webtop:" && curl -sf http://localhost:6080 > /dev/null && echo "OK"
```

---

## Manual Testing

### Checklist for New Features

- [ ] Install in minimal base image
- [ ] Install in full base image
- [ ] Run install script twice (idempotence)
- [ ] Verify no daemons left running
- [ ] Check exit codes
- [ ] Test in Codespaces
- [ ] Test on macOS (arm64)
- [ ] Test on Linux (amd64)

### Checklist for New Templates

- [ ] Template materializes without errors
- [ ] All features install correctly
- [ ] All services start
- [ ] Health checks pass
- [ ] Ports are accessible
- [ ] Environment variables work
- [ ] Documentation is accurate
- [ ] Works in Codespaces
- [ ] Works locally (Docker Desktop)

### Checklist for New Services

- [ ] Docker Compose file is valid
- [ ] Service starts without errors
- [ ] Health check endpoint works
- [ ] Ports are correctly mapped
- [ ] Environment variables documented
- [ ] README includes usage examples
- [ ] `.env.example` provided
- [ ] Compatible with other services

---

## Test Coverage Goals

### Current Coverage

- Features: 80%+ (via `devcontainer features test`)
- Templates: 60%+ (smoke tests)
- Services: 90%+ (health checks)
- Manifests: 100% (schema validation)

### Improving Coverage

1. **Add feature test scenarios:**
   - Minimal base image
   - Full base image
   - With/without other features

2. **Add template variations:**
   - Different service combinations
   - Different base images

3. **Add integration tests:**
   - Multi-service workflows
   - Cross-service communication

---

## Debugging Failed Tests

### View Test Logs

```bash
# Feature tests
cat features/supabase-cli/test/_test_output.log

# Template builds
docker logs <container-id>
```

### Interactive Debugging

```bash
# Drop into container
docker run --rm -it ghcr.io/airnub-labs/devcontainer-images/dev-base:1 bash

# Install feature manually
bash features/supabase-cli/install.sh

# Debug interactively
supabase --help
```

### Common Test Failures

1. **Network timeouts:**
   - Increase timeout values
   - Check internet connectivity
   - Use cached downloads

2. **Permission errors:**
   - Check file permissions
   - Run as non-root user
   - Verify ownership

3. **Port conflicts:**
   - Use random ports in tests
   - Clean up containers after tests
   - Check for orphaned containers

---

## Related Documentation

- **[Development Setup](./development.md)** - Get started contributing
- **[Contributing Guide](./README.md)** - Contribution guidelines
- **[Troubleshooting](../operations/troubleshooting.md)** - Common issues

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
