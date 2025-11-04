# Runme Agent Sample

This sample demonstrates the README automation Feature. The commands are intentionally safe to run repeatedly.

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
