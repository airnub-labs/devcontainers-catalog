# Dev Container Lifecycle Scripts

This directory contains scripts that run during the dev container lifecycle.

## Scripts

### postCreate.sh

Runs once after the container is created. This script:
- Waits for the Temporal server to be ready
- Creates a default development namespace
- Displays connection information

### postStart.sh

Runs every time the container starts. This script:
- Displays quick reference information about Temporal endpoints
- Shows common commands

## Customization

Feel free to modify these scripts to add:
- Additional namespaces
- Sample workflow setup
- Custom environment configuration
- SDK-specific setup steps
