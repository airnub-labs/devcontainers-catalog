import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import type { AuthMode } from "./types.js";

export type OctokitFactory = { octokit: Octokit; baseUrl?: string };

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
