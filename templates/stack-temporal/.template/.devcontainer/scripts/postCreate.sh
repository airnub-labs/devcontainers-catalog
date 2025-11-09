#!/bin/bash
set -e

echo "========================================="
echo "Temporal Development Environment Setup"
echo "========================================="

# Wait for Temporal server to be ready
echo "Waiting for Temporal server to be ready..."
until temporal operator namespace list >/dev/null 2>&1; do
  echo "  Temporal server not ready yet, waiting..."
  sleep 2
done
echo "✓ Temporal server is ready!"

# Create a default namespace for development
echo "Setting up default development namespace..."
if ! temporal operator namespace describe default >/dev/null 2>&1; then
  temporal operator namespace create default --description "Default development namespace"
  echo "✓ Created 'default' namespace"
else
  echo "✓ 'default' namespace already exists"
fi

# Display connection information
echo ""
echo "========================================="
echo "Temporal Environment Information"
echo "========================================="
echo "Temporal gRPC endpoint: temporal:7233"
echo "Temporal UI: http://localhost:8233"
echo ""
echo "Available namespaces:"
temporal operator namespace list
echo ""
echo "✓ Setup complete! You can now start building Temporal workflows."
echo "========================================="
