# Troubleshooting Guide

**Navigation:** [Documentation Hub](../README.md) > [Operations](./README.md) > Troubleshooting

> Common issues and solutions for the Airnub DevContainers Catalog

---

## Quick Diagnosis

### Check Service Health

```bash
# Check all sidecar services
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

# Test Redis
docker exec -it redis-dev redis-cli ping
# Expected: PONG

# Test Supabase
curl http://localhost:54321/health
# Expected: {"status":"ok"}

# Test Kafka
docker exec -it kafka-dev kafka-topics --list --bootstrap-server localhost:9092
```

### Check Logs

```bash
# View all service logs
docker compose logs

# Follow specific service
docker compose logs -f redis

# Last 100 lines
docker compose logs --tail=100 supabase
```

---

## Common Issues

### Container Build Issues

#### Issue: "Feature install failed"

**Symptoms:**
```
ERROR: failed to solve: process "/bin/sh -c ..." did not complete successfully
```

**Solutions:**

1. **Check feature compatibility:**
   ```bash
   # Verify feature exists
   docker run ghcr.io/airnub-labs/devcontainer-features/supabase-cli:1 --version
   ```

2. **Clear Docker cache:**
   ```bash
   docker builder prune -a
   devcontainer build --no-cache
   ```

3. **Check network connectivity:**
   ```bash
   ping github.com
   ```

4. **Verify base image:**
   ```json
   {
     "image": "ghcr.io/airnub-labs/devcontainer-images/dev-base:1"
   }
   ```

#### Issue: "Out of disk space"

**Symptoms:**
```
ERROR: failed to solve: error writing layer blob: no space left on device
```

**Solutions:**

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Remove build cache
docker builder prune -a
```

---

### Service Connection Issues

#### Issue: Redis not accessible

**Symptoms:**
- Can't connect to `localhost:6379`
- `redis-cli` returns connection refused

**Solutions:**

1. **Check if Redis is running:**
   ```bash
   docker ps | grep redis
   ```

2. **Check port mapping:**
   ```bash
   docker port redis-dev 6379
   # Should show: 6379/tcp -> 0.0.0.0:6379
   ```

3. **Restart Redis:**
   ```bash
   docker compose restart redis
   ```

4. **Check logs:**
   ```bash
   docker compose logs redis
   ```

5. **Test connection:**
   ```bash
   redis-cli -h localhost -p 6379 ping
   # Expected: PONG
   ```

#### Issue: Supabase not starting

**Symptoms:**
- Can't access `localhost:54321`
- Supabase Studio not loading

**Solutions:**

1. **Check all Supabase containers:**
   ```bash
   docker ps | grep supabase
   # Should show: supabase-db, supabase-studio, supabase-auth, etc.
   ```

2. **Check Postgres health:**
   ```bash
   docker exec supabase-db pg_isready
   # Expected: /var/run/postgresql:5432 - accepting connections
   ```

3. **Verify environment variables:**
   ```bash
   cat .devcontainer/.env | grep SUPABASE
   ```

4. **Restart Supabase stack:**
   ```bash
   docker compose down
   docker compose up -d supabase
   ```

5. **Check logs:**
   ```bash
   docker compose logs supabase-db
   docker compose logs supabase-auth
   ```

#### Issue: Kafka not ready

**Symptoms:**
- Kafka commands timeout
- Consumer/producer can't connect

**Solutions:**

1. **Wait for Kafka to be ready:**
   ```bash
   # Kafka can take 30-60s to start
   docker compose logs -f kafka | grep "started (kafka.server.KafkaServer)"
   ```

2. **Check KRaft mode:**
   ```bash
   docker exec kafka-dev kafka-metadata --snapshot /tmp/kraft-combined-logs/__cluster_metadata-0/00000000000000000000.log --print
   ```

3. **Test connection:**
   ```bash
   docker exec kafka-dev kafka-broker-api-versions --bootstrap-server localhost:9092
   ```

4. **Create test topic:**
   ```bash
   docker exec kafka-dev kafka-topics --create \\
     --topic test \\
     --bootstrap-server localhost:9092 \\
     --partitions 1 \\
     --replication-factor 1
   ```

---

### Codespaces Issues

#### Issue: Port forwarding not working

**Symptoms:**
- Can't access services in Codespaces
- "Port not found" errors

**Solutions:**

1. **Check port visibility in Codespaces:**
   - Go to "Ports" tab in VS Code
   - Ensure ports are set to "Public" or "Private" as needed

2. **Forward ports explicitly:**
   ```json
   // .devcontainer/devcontainer.json
   {
     "forwardPorts": [3000, 6379, 54321, 6080]
   }
   ```

3. **Use Codespaces URL format:**
   ```
   https://<codespace-name>-<port>.preview.app.github.dev
   ```

#### Issue: Secrets not available

**Symptoms:**
- Environment variables undefined
- Services fail to authenticate

**Solutions:**

1. **Add secrets to Codespaces:**
   - GitHub repo → Settings → Secrets and variables → Codespaces
   - Add required secrets (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)

2. **Map secrets in devcontainer.json:**
   ```json
   {
     "containerEnv": {
       "SUPABASE_URL": "${localEnv:SUPABASE_URL}",
       "SUPABASE_ANON_KEY": "${localEnv:SUPABASE_ANON_KEY}"
     }
   }
   ```

3. **Rebuild container:**
   - Cmd/Ctrl+Shift+P → "Dev Containers: Rebuild Container"

---

### CLI Issues

#### Issue: "devc: command not found"

**Solutions:**

1. **Install the CLI:**
   ```bash
   npm install -g @airnub/devc
   # or
   pnpm add -g @airnub/devc
   ```

2. **Check installation:**
   ```bash
   which devc
   devc --version
   ```

3. **Add to PATH (if needed):**
   ```bash
   export PATH=$PATH:$(npm config get prefix)/bin
   ```

#### Issue: "Catalog not found"

**Solutions:**

1. **Use remote catalog:**
   ```bash
   devc generate lesson.yaml --catalog-ref main
   ```

2. **Specify catalog root:**
   ```bash
   devc generate lesson.yaml --catalog-root /path/to/catalog
   ```

3. **Run from catalog directory:**
   ```bash
   cd /path/to/devcontainers-catalog
   devc generate examples/lesson-manifests/intro-ai-week02.yaml
   ```

#### Issue: "Service fragment not found"

**Solutions:**

```bash
# Fetch missing fragments
devc generate lesson.yaml --fetch-missing-fragments

# Or add service manually
cd workspace
devc add service redis --fetch-missing-fragments
```

---

### Performance Issues

#### Issue: Slow container builds

**Solutions:**

1. **Use prebuilt images:**
   ```json
   {
     "image": "ghcr.io/airnub-labs/devcontainer-images/dev-web:1"
   }
   ```

2. **Enable BuildKit:**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

3. **Use build cache:**
   ```bash
   devcontainer build --cache-from type=registry,ref=ghcr.io/...
   ```

4. **Optimize Dockerfile:**
   - Order layers by change frequency (least to most)
   - Combine RUN commands
   - Use multi-stage builds

#### Issue: High memory usage

**Solutions:**

1. **Limit service resources:**
   ```yaml
   # docker-compose.yml
   services:
     redis:
       deploy:
         resources:
           limits:
             memory: 512M
   ```

2. **Disable unused services:**
   ```bash
   # Only start specific services
   docker compose up -d redis supabase
   ```

3. **Increase Docker memory:**
   - Docker Desktop → Settings → Resources → Memory
   - Recommend: 8GB minimum for full stack

---

### Image Registry Issues

#### Issue: "unauthorized: authentication required"

**Solutions:**

1. **Login to GHCR:**
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. **Create GitHub Personal Access Token:**
   - GitHub Settings → Developer settings → Personal access tokens
   - Scopes: `read:packages`, `write:packages`

3. **Set token in environment:**
   ```bash
   export GITHUB_TOKEN=ghp_xxx...
   ```

#### Issue: "manifest unknown"

**Solutions:**

1. **Verify image exists:**
   ```bash
   docker pull ghcr.io/airnub-labs/devcontainer-images/dev-base:1
   ```

2. **Check tag:**
   ```bash
   # Use specific version, not :latest if it doesn't exist
   docker pull ghcr.io/airnub-labs/devcontainer-images/dev-base:1.0.0
   ```

3. **Try different architecture:**
   ```bash
   docker pull --platform linux/amd64 ghcr.io/...
   ```

---

### Desktop Environment Issues

#### Issue: noVNC not loading

**Symptoms:**
- Blank screen at `localhost:6080`
- Connection refused

**Solutions:**

1. **Check noVNC container:**
   ```bash
   docker ps | grep webtop
   docker compose logs webtop
   ```

2. **Verify VNC password:**
   ```bash
   echo $VNC_PASSWORD
   # Should be set in .env or devcontainer.json
   ```

3. **Test VNC connection:**
   ```bash
   curl http://localhost:6080
   # Should return HTML
   ```

4. **Restart webtop:**
   ```bash
   docker compose restart webtop
   ```

#### Issue: Desktop apps not starting

**Solutions:**

1. **Check display environment:**
   ```bash
   echo $DISPLAY
   # Should be :1 or similar
   ```

2. **Verify X11 socket:**
   ```bash
   docker exec webtop ls -la /tmp/.X11-unix/
   ```

3. **Test with simple app:**
   ```bash
   docker exec webtop xeyes
   ```

---

## Health Check Commands

### All Services

```bash
#!/bin/bash
# health-check.sh

echo "=== Redis ==="
redis-cli ping || echo "❌ Redis not responding"

echo "=== Supabase ==="
curl -s http://localhost:54321/health | jq '.status' || echo "❌ Supabase not responding"

echo "=== Kafka ==="
docker exec kafka-dev kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1 && echo "✅ Kafka OK" || echo "❌ Kafka not ready"

echo "=== noVNC/Webtop ==="
curl -s http://localhost:6080 > /dev/null && echo "✅ Webtop OK" || echo "❌ Webtop not responding"
```

### Service-Specific Health

See [Sidecars Health](./sidecars-health.md) for detailed health check endpoints.

---

## Getting Help

If you're still stuck:

1. **Check GitHub Issues:**
   - [Existing issues](https://github.com/airnub-labs/devcontainers-catalog/issues)
   - Search for your error message

2. **Open a new issue:**
   - Include error messages
   - Attach relevant logs
   - Specify environment (local Docker, Codespaces, etc.)

3. **Ask in Discussions:**
   - [GitHub Discussions](https://github.com/airnub-labs/devcontainers-catalog/discussions)

---

## Related Documentation

- **[Sidecars Health](./sidecars-health.md)** - Health check endpoints
- **[Docker Containers](./docker-containers.md)** - Container operations
- **[Services Reference](../reference/services.md)** - Service configuration
- **[Using the CLI](../getting-started/using-cli.md)** - CLI troubleshooting

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
