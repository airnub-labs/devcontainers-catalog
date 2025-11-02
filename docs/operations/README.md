# Operations

> Deployment, health checks, and operational procedures

This directory contains operational documentation for deploying, monitoring, and maintaining devcontainer environments.

---

## Operational Guides

### [Sidecars Health](./sidecars-health.md)
**Health check endpoints and monitoring**

Covers:
- Service health check endpoints
- Container readiness checks
- Monitoring sidecar services
- Debugging unhealthy containers

### [Docker Containers](./docker-containers.md)
**Container operations and management**

Details:
- Container lifecycle management
- Resource allocation
- Networking configuration
- Volume management

---

## Common Operations

### Health Checks
- **Redis:** `redis-cli ping` → `PONG`
- **Supabase:** Studio at `:54323`, API at `:54321`
- **Kafka:** `kafka-topics --bootstrap-server`
- **Airflow:** Web UI at `:8080`
- **Prefect:** UI at `:4200`
- **Dagster:** UI at `:3000`
- **Temporal:** UI at `:8088`

### Troubleshooting

**Container won't start:**
1. Check logs: `docker compose logs <service>`
2. Verify ports not in use
3. Check resource limits
4. Validate compose file syntax

**Service not reachable:**
1. Verify port forwarding
2. Check network configuration
3. Ensure service is healthy
4. Review firewall rules

---

## Deployment Patterns

### Local Development
- Docker Desktop or Docker Engine
- Port forwarding to localhost
- Volume mounts for persistence

### GitHub Codespaces
- Automatic port forwarding
- Secrets via Codespaces secrets
- Lifecycle hooks (postCreate, postStart)

### CI/CD
- Multi-arch image builds
- SBOM and provenance generation
- Automated publishing to GHCR

---

## Related Documentation

- **[Services Reference](../reference/services.md)** - Service configurations
- **[Architecture](../architecture/README.md)** - System design
- **[Guides](../guides/README.md)** - How-to guides

---

**Last Updated:** 2025-11-02 (Phase 5: Organize Remaining Docs)
