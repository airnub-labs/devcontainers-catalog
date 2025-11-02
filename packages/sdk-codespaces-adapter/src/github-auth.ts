import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import type { AuthMode } from "./types.js";

/**
 * Result of creating an Octokit client for GitHub API access.
 *
 * @public
 */
export type OctokitFactory = { octokit: Octokit; baseUrl?: string };

/**
 * Creates an authenticated Octokit instance from the provided credentials.
 *
 * Supports PAT and GitHub App authentication flows. When a custom `baseUrl`
 * is supplied the client is configured for GitHub Enterprise Server.
 *
 * @param auth - Authentication mode
 * @param opts - Additional configuration
 * @param opts.baseUrl - Custom GitHub API base URL
 * @returns Authenticated Octokit client and resolved base URL
 *
 * @example
 * ```typescript
 * const { octokit } = await makeOctokit({ kind: "pat", token: process.env.GITHUB_TOKEN! });
 * const repos = await octokit.repos.listForAuthenticatedUser();
 * ```
 *
 * @public
 */
export async function makeOctokit(auth: AuthMode, opts?: { baseUrl?: string }): Promise<OctokitFactory> {
  const baseUrl = opts?.baseUrl;
  if (auth.kind === "pat") {
    const octokit = new Octokit({ auth: auth.token, baseUrl });
    return { octokit, baseUrl };
  }
  const appAuth = createAppAuth({
    appId: auth.appId,
    privateKey: auth.privateKeyPem,
    installationId: auth.installationId
  });
  const installation = await appAuth({ type: "installation" });
  const octokit = new Octokit({ auth: installation.token, baseUrl });
  return { octokit, baseUrl };
}
