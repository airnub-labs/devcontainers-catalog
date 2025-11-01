/**
 * Public SDK for the Airnub DevContainers CLI.
 *
 * This module exports the programmatic interface for generating dev container
 * stacks, allowing you to build classroom-ready development environments
 * programmatically without using the CLI.
 *
 * @example
 * ```typescript
 * import { generateStack } from "@airnub/devc";
 *
 * const result = await generateStack({
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/deno:1"]
 * });
 *
 * console.log(`Generated ${result.plan.files.length} files`);
 * ```
 *
 * @packageDocumentation
 * @module @airnub/devc
 */

/**
 * Generates a complete dev container stack from a template.
 *
 * This function merges a base template with browser sidecars, custom features,
 * and additional files to produce a ready-to-use dev container configuration.
 * It handles port conflict resolution, YAML merging, and scaffolding generation.
 *
 * @see {@link GenerateStackInput} for input options
 * @see {@link MergePlan} for the returned plan structure
 */
export { generateStack } from "./lib/stacks.js";

/**
 * Configuration for generating a dev container stack.
 *
 * @see {@link generateStack}
 */
export type { GenerateStackInput, RepoInsert, MergePlan } from "./lib/stacks.js";
