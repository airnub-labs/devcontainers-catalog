# Temporal CLI (temporal-cli)

Installs the [Temporal CLI](https://github.com/temporalio/cli) for interacting with Temporal Server, Workflows, Activities, and Namespaces.

## Example Usage

```jsonc
"features": {
    "ghcr.io/airnub-labs/devcontainer-features/temporal-cli:1": {}
}
```

## Options

| Options Id | Description | Type | Default Value |
|-----|-----|-----|-----|
| version | Version of Temporal CLI to install (e.g., 'latest', '1.5.1', or 'v1.5.1') | string | latest |
| offline | Enable offline installation mode (requires cacheDir) | boolean | false |
| cacheDir | Directory containing cached Temporal CLI binaries for offline installation | string | "" |

## Examples

### Install Latest Version

```jsonc
"features": {
    "ghcr.io/airnub-labs/devcontainer-features/temporal-cli:1": {}
}
```

### Install Specific Version

```jsonc
"features": {
    "ghcr.io/airnub-labs/devcontainer-features/temporal-cli:1": {
        "version": "1.5.1"
    }
}
```

### Offline Installation with Cache

```jsonc
"features": {
    "ghcr.io/airnub-labs/devcontainer-features/temporal-cli:1": {
        "version": "1.5.1",
        "offline": true,
        "cacheDir": "/path/to/cache"
    }
}
```

## Usage

After installation, the `temporal` command will be available globally:

```bash
# Check version
temporal --version

# Start a local Temporal server
temporal server start-dev

# Create a namespace
temporal operator namespace create my-namespace

# List namespaces
temporal operator namespace list

# Get help
temporal --help
```

## Common Commands

### Server Management
```bash
# Start Temporal dev server (includes UI at localhost:8233)
temporal server start-dev

# Start with specific database
temporal server start-dev --db-filename /tmp/temporal.db
```

### Workflow Operations
```bash
# List workflows
temporal workflow list

# Describe a workflow
temporal workflow describe --workflow-id <workflow-id>

# Show workflow history
temporal workflow show --workflow-id <workflow-id>

# Terminate a workflow
temporal workflow terminate --workflow-id <workflow-id>
```

### Namespace Management
```bash
# Create namespace
temporal operator namespace create my-namespace

# List namespaces
temporal operator namespace list

# Describe namespace
temporal operator namespace describe my-namespace
```

## Notes

- **Platform Support**: This feature supports Linux (amd64, arm64) architectures
- **Prerequisites**: The feature uses `tar` for extraction, which will be installed automatically if not available
- **Idempotent**: Safe to run multiple times; skips installation if the requested version is already installed
- **Version Format**: Accepts version strings with or without the 'v' prefix (e.g., '1.5.1' or 'v1.5.1')

## Related Services

This feature pairs well with the Temporal service fragment available in this catalog. See `/services/temporal/` for Docker Compose service definitions.

## Learn More

- [Temporal CLI Documentation](https://docs.temporal.io/cli)
- [Temporal CLI GitHub Repository](https://github.com/temporalio/cli)
- [Temporal Documentation](https://docs.temporal.io/)

---

**Note**: This is part of the [airnub-labs/devcontainers-catalog](https://github.com/airnub-labs/devcontainers-catalog).
