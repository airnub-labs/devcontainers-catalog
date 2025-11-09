#!/bin/bash
# Post-start script for Temporal development environment

echo "Temporal development environment is ready!"
echo "  - Temporal gRPC: temporal:7233"
echo "  - Temporal UI: http://localhost:8233"
echo ""
echo "Quick commands:"
echo "  temporal workflow list           - List workflows"
echo "  temporal operator namespace list - List namespaces"
echo "  temporal --help                  - View all commands"
