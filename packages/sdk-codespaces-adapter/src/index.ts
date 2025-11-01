/**
 * GitHub Codespaces integration SDK.
 *
 * This package provides a TypeScript client for managing GitHub Codespaces
 * programmatically, including:
 * - Creating and configuring codespaces
 * - Managing port visibility and labels
 * - Setting secrets (user, org, repo scopes)
 * - Starting, stopping, and deleting codespaces
 *
 * @example
 * ```typescript
 * import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";
 *
 * const adapter = makeCodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN! });
 *
 * const codespace = await adapter.create({
 *   repo: { owner: "myorg", repo: "myrepo", ref: "main" },
 *   displayName: "Student Workspace",
 *   machine: "standardLinux32gb"
 * });
 *
 * console.log(`Created: ${codespace.webUrl}`);
 * ```
 *
 * @packageDocumentation
 * @module @airnub/sdk-codespaces-adapter
 */

export * from "./types.js";
export * from "./errors.js";

/**
 * Creates an authenticated Octokit client for the chosen auth mode.
 *
 * @see {@link makeOctokit}
 */
export { makeOctokit } from "./github-auth.js";

/**
 * Low-level GitHub REST client for Codespaces operations.
 *
 * @see {@link GithubClient}
 */
export { GithubClient } from "./github-client.js";

/**
 * GitHub CLI helper utilities used for port configuration.
 */
export * as Gh from "./gh.js";

/**
 * Secret encryption helper for GitHub Codespaces.
 */
export { sealForGitHub } from "./seal.js";

/**
 * High-level adapter and factory for working with Codespaces.
 */
export { CodespacesAdapter, makeCodespacesAdapter } from "./adapter.js";
