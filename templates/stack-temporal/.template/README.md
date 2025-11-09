# Temporal Workflow Development Environment

This project is set up with a complete Temporal development environment.

## Getting Started

The Temporal server and UI are automatically started when you open this workspace.

- **Temporal Server**: `temporal:7233`
- **Temporal UI**: [http://localhost:8233](http://localhost:8233)

## Quick Commands

```bash
# List workflows
temporal workflow list

# List namespaces
temporal operator namespace list

# View CLI help
temporal --help
```

## Supported SDKs

This environment includes:

- **TypeScript/Node.js**: Install with `npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity`
- **Go**: Install with `go get go.temporal.io/sdk@latest`
- **Python**: Install with `pip install temporalio`

## Next Steps

1. Choose your SDK and initialize a Temporal project
2. Define your workflows and activities
3. Run a worker to execute workflows
4. View workflow execution in the Temporal UI

For more information, visit [Temporal Documentation](https://docs.temporal.io/).
