#!/usr/bin/env bash
set -euo pipefail

runme --version

echo "Creating sample README for tests..."
cat <<'README' > README.md
# Test Scenario

## Setup
```sh { name=setup }
echo "Installing demo dependencies..."
touch .sample-installed
```

## Dev
```sh { name=dev }
echo "Starting demo process..."
cat .sample-installed 2>/dev/null || echo "(nothing installed yet)"
```
README

echo "Running airnub-autosetup with confirmation bypass..."
output=$(AIRNUB_CONFIRM=1 airnub-autosetup --readme README.md --blocks "setup,dev")

printf '%s\n' "${output}" | grep -F "Plan (in order):"
printf '%s\n' "${output}" | grep -F "runme run setup"
printf '%s\n' "${output}" | grep -F "runme run dev"
printf '%s\n' "${output}" | grep -F "Block 'setup' completed successfully."
printf '%s\n' "${output}" | grep -F "Block 'dev' completed successfully."

test -f .sample-installed

echo "airnub-autosetup completed successfully in test scenario."
