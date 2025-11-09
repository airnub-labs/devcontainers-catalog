# Stack: Temporal Workflow Development

A complete development environment for building reliable distributed applications with [Temporal](https://temporal.io/).

## What's Included

This stack provides everything you need to develop Temporal workflows:

- **Temporal Server**: Auto-setup instance running on port 7233
- **Temporal UI**: Web interface for workflow visualization on port 8233
- **Temporal CLI**: Command-line tool for managing workflows and namespaces
- **Multi-language Support**: Node.js, Python, and Go SDKs ready to use
- **Docker-in-Docker**: Build and run containers within your dev environment
- **Optional Redis**: Enable caching and session management

## Services

| Service | Port | Description |
|---------|------|-------------|
| Temporal gRPC | 7233 | Temporal server endpoint |
| Temporal UI | 8233 | Web interface for workflows |
| Redis (optional) | 6379 | Caching and session storage |

## Quick Start

After the container starts, the Temporal server will be automatically configured with a default namespace.

### Create Your First Workflow (TypeScript)

```bash
# Initialize a new Temporal project
npm init @temporalio ./my-temporal-project
cd my-temporal-project

# Install dependencies
npm install

# Start a worker
npm run start.watch

# In another terminal, run a workflow
npm run workflow
```

### Create Your First Workflow (Go)

```bash
# Initialize a Go module
go mod init my-temporal-app

# Install Temporal Go SDK
go get go.temporal.io/sdk@latest

# Create your workflow and worker files
# Then run your worker
go run worker/main.go
```

### Create Your First Workflow (Python)

```bash
# Install Temporal Python SDK
pip install temporalio

# Create your workflow files
# Then run your worker
python worker.py
```

## Common Temporal CLI Commands

```bash
# List all workflows
temporal workflow list

# Describe a specific workflow
temporal workflow describe --workflow-id <workflow-id>

# Show workflow execution history
temporal workflow show --workflow-id <workflow-id>

# Create a new namespace
temporal operator namespace create my-namespace

# List all namespaces
temporal operator namespace list

# Start the dev server (already running in the stack)
temporal server start-dev
```

## Environment Variables

The following environment variables are pre-configured:

- `TEMPORAL_ADDRESS`: Points to `temporal:7233` (server endpoint)
- `TEMPORAL_UI_ADDRESS`: Points to `http://temporal-ui:8080`

## Template Options

When creating a new project from this template, you can customize:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `temporalUiPort` | integer | 8233 | Port to expose the Temporal UI |
| `includeRedis` | boolean | false | Include a Redis sidecar |
| `temporalVersion` | string | latest | Temporal CLI version to install |

## VS Code Extensions

This stack includes helpful extensions:

- Go language support
- Python language support and Pylance
- ESLint and Prettier for JavaScript/TypeScript
- GitHub Copilot (if available)

## Learn More

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://docs.temporal.io/typescript)
- [Temporal Go SDK](https://docs.temporal.io/go)
- [Temporal Python SDK](https://docs.temporal.io/python)
- [Temporal CLI Reference](https://docs.temporal.io/cli)

## Troubleshooting

### Temporal server not responding

Check if the Temporal server is healthy:

```bash
docker ps
```

Look for the `temporal` and `temporal-ui` containers and verify they're healthy.

### Can't connect to Temporal

Ensure you're using the correct address:

```bash
temporal operator namespace list --address temporal:7233
```

### View Temporal logs

```bash
docker logs temporal
docker logs temporal-ui
```

## Project Structure Suggestions

```
my-temporal-project/
├── workflows/          # Workflow definitions
├── activities/         # Activity implementations
├── worker/            # Worker process
└── starter/           # Workflow starters/clients
```

---

**Note**: This template is part of the [airnub-labs/devcontainers-catalog](https://github.com/airnub-labs/devcontainers-catalog).
