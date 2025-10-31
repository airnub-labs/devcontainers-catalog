# @airnub/devcontainers-catalog-generator

A lightweight generator that materialises Dev Container workspaces from the AirNub catalog. The generator is provider-agnostic and is intended to be called by higher-level platforms (e.g. the comhrá SaaS) to create ready-to-push repositories.

## Usage

```bash
npm install --global @airnub/devcontainers-catalog-generator
catalog-generate config.json
```

The configuration file must match the `GeneratorInput` type exported by this package and looks like:

```json
{
  "stackId": "nextjs-supabase@1.0.0",
  "browsers": ["neko-chrome"],
  "pin": "<catalog commit sha>"
}
```

Running the command outputs the resolved manifest location and workspace directory. The `manifest.json` file is guaranteed to follow the `@airnub/devcontainers-catalog-manifest` schema.
