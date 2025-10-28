#!/usr/bin/env bash
set -euo pipefail

FEATURE_DIR="/usr/local/share/devcontainer/features/docker-in-docker-plus"
PROFILE_FILE="/etc/profile.d/docker-buildkit.sh"
DAEMON_FILE="/etc/docker/daemon.json"

if [ ! -f "${FEATURE_DIR}/feature-installed.txt" ]; then
    echo "docker-in-docker-plus installation note missing" >&2
    exit 1
fi

if [ ! -f "${PROFILE_FILE}" ]; then
    echo "Profile configuration not found" >&2
    exit 1
fi

grep -q 'DOCKER_BUILDKIT=1' "${PROFILE_FILE}"
grep -q 'COMPOSE_DOCKER_CLI_BUILD=1' "${PROFILE_FILE}"

if [ -f "${DAEMON_FILE}" ]; then
    grep -q '"buildkit": true' "${DAEMON_FILE}" || {
        echo "buildkit not enabled in daemon.json" >&2
        exit 1
    }
fi
