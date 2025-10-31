# Coding Agent Prompt — Bootstrap Stubs + Concrete Patches for CodespacesAdapter (SDK)

**Repo:** `airnub-labs/devcontainers-catalog`

**Run on branch:** your open PR branch from the previous prompt (or create `feat/codespaces-adapter-stubs-and-patches` and PR to it).

**Goal:**

1. Generate **minimal TypeScript stubs** so the SDK **compiles immediately**.
2. Apply **concrete patches** for `github-auth.ts`, `github-client.ts`, and the **`gh` CLI wrapper** with cross-platform handling.
3. Leave `adapter.ts` compilable with TODOs where implementation depends on local policy.

> Keep code **strict TS** with helpful errors; add unit-test placeholders. Avoid leaking plaintext secrets.

---

## 0) Package wiring (dependencies)

**Update** `packages/sdk-codespaces-adapter/package.json`:

```json
{
  "name": "@airnub/sdk-codespaces-adapter",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@octokit/rest": "^20.1.1",
    "@octokit/auth-app": "^6.0.6",
    "libsodium-wrappers": "^0.7.13"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.4",
    "nock": "^13.5.4"
  }
}
```

**Add** `packages/sdk-codespaces-adapter/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"]
}
```

---

## 1) Minimal stubs (compilable now)

**Create** `packages/sdk-codespaces-adapter/src/types.ts`

```ts
export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };

export type RepoRef = { owner: string; repo: string; ref?: string };
export type Region = string;
export type PortVisibility = "private" | "org" | "public";

export type CreateCodespaceRequest = {
  repo: RepoRef;
  devcontainerPath?: string;
  machine?: string;
  region?: Region;
  displayName?: string;
  idleTimeoutMinutes?: number;
  retentionPeriodMinutes?: number;
  environmentVariables?: Record<string, string>;
  secrets?: Record<string, string>;
  ports?: Array<{ port: number; visibility: PortVisibility; label?: string }>;
  startImmediately?: boolean;
  schoolMode?: boolean;
};

export type CodespaceInfo = {
  id: string;
  name: string;
  state: string;
  webUrl: string;
  createdAt: string;
  lastUsedAt?: string;
  region?: Region;
  machine?: string;
  repo: RepoRef;
};

export type PlanNote = { level: "info" | "warn" | "error"; message: string };
export type Plan = {
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: Array<{ port:number; visibility: PortVisibility; label?: string }>; target: { id?: string; name?: string } }
    | { op: "stop-codespace"; target: { id?: string; name?: string } }
    | { op: "start-codespace"; target: { id?: string; name?: string } }
    | { op: "delete-codespace"; target: { id?: string; name?: string } }
    | { op: "set-secrets"; scope: "repo" | "org" | "user"; entries: string[]; repo?: RepoRef; org?: string }
  >;
  notes: PlanNote[];
};

export interface ICodespacesAdapter {
  ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void>;
  listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]>;
  getCodespaceByName(name: string): Promise<CodespaceInfo | null>;
  getCodespace(id: string): Promise<CodespaceInfo | null>;
  listMachines(repo: RepoRef): Promise<string[]>;
  planCreate(req: CreateCodespaceRequest): Promise<Plan>;
  create(req: CreateCodespaceRequest): Promise<CodespaceInfo>;
  stop(target: { id?: string; name?: string }): Promise<void>;
  start(target: { id?: string; name?: string }): Promise<CodespaceInfo>;
  delete(target: { id?: string; name?: string }): Promise<void>;
  setPorts(target: { id?: string; name?: string }, ports: Array<{ port:number; visibility: PortVisibility; label?: string }>): Promise<void>;
  setSecrets(scope: "repo" | "org" | "user", entries: Record<string,string>, ctx?: { repo?: RepoRef; org?: string }): Promise<void>;
  openUrl(target: { id?: string; name?: string }): Promise<string>;
}
```

**Create** `packages/sdk-codespaces-adapter/src/errors.ts`

```ts
export class AuthError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class RateLimitError extends Error {
  constructor(message: string, public retryAfterSec?: number) { super(message); }
}
```

**Create** `packages/sdk-codespaces-adapter/src/github-auth.ts`

```ts
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import type { AuthMode } from "./types.js";

export type OctokitFactory = { octokit: Octokit; baseUrl?: string };

export async function makeOctokit(auth: AuthMode, opts?: { baseUrl?: string }): Promise<OctokitFactory> {
  const baseUrl = opts?.baseUrl; // allow GHES
  if (auth.kind === "pat") {
    const octokit = new Octokit({ auth: auth.token, baseUrl });
    return { octokit, baseUrl };
  }
  const appAuth = createAppAuth({ appId: auth.appId, privateKey: auth.privateKeyPem, installationId: auth.installationId });
  const installation = await appAuth({ type: "installation" });
  const octokit = new Octokit({ auth: installation.token, baseUrl });
  return { octokit, baseUrl };
}
```

**Create** `packages/sdk-codespaces-adapter/src/github-client.ts`

```ts
import type { Octokit } from "@octokit/rest";
import type { RepoRef } from "./types.js";
import { RateLimitError } from "./errors.js";

async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try { return await fn(); } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      const retryAfter = Number(e?.response?.headers?.["retry-after"]) || undefined;
      if (status === 403 && (e?.response?.headers?.["x-ratelimit-remaining"] === "0" || retryAfter)) {
        const delay = retryAfter ? retryAfter * 1000 : Math.min(30000, 1000 * Math.pow(2, attempt));
        await new Promise(r => setTimeout(r, delay));
        attempt++;
        continue;
      }
      throw e;
    }
  }
}

export class GithubClient {
  constructor(private octokit: Octokit) {}

  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }) {
    if (!params?.owner || !params?.repo) {
      // fallback to all for user
      const res = await withBackoff(() => this.octokit.request("GET /user/codespaces"));
      return res.data.codespaces ?? [];
    }
    const res = await withBackoff(() => this.octokit.request("GET /repos/{owner}/{repo}/codespaces", { owner: params.owner!, repo: params.repo! }));
    return res.data.codespaces ?? [];
  }

  async getCodespaceByName(name: string) {
    try {
      const res = await withBackoff(() => this.octokit.request("GET /user/codespaces/{codespace_name}", { codespace_name: name }));
      return res.data;
    } catch (e: any) {
      if (e?.status === 404) return null; throw e;
    }
  }

  async getCodespace(id: string) {
    try {
      const res = await withBackoff(() => this.octokit.request("GET /user/codespaces/{codespace_name}", { codespace_name: id }));
      return res.data;
    } catch (e: any) {
      if (e?.status === 404) return null; throw e;
    }
  }

  async listRepoMachines(repo: RepoRef) {
    const res = await withBackoff(() => this.octokit.request("GET /repos/{owner}/{repo}/codespaces/machines", { owner: repo.owner, repo: repo.repo, location: undefined, ref: repo.ref }));
    return (res.data.machines ?? []).map((m: any) => m.name ?? m.display_name ?? m.machine_type ?? "").filter(Boolean);
  }

  async devcontainerExists(repo: RepoRef, devcontainerPath?: string) {
    if (!devcontainerPath) return true; // nothing to check
    try {
      await withBackoff(() => this.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { owner: repo.owner, repo: repo.repo, path: devcontainerPath, ref: repo.ref }));
      return true;
    } catch (e: any) { return false; }
  }

  async createCodespace(req: { repo: RepoRef; displayName?: string; machine?: string; devcontainerPath?: string; location?: string; idleTimeoutMinutes?: number; retentionPeriodMinutes?: number; env?: Record<string,string> }) {
    return withBackoff(() => this.octokit.request("POST /repos/{owner}/{repo}/codespaces", {
      owner: req.repo.owner,
      repo: req.repo.repo,
      ref: req.repo.ref,
      display_name: req.displayName,
      machine: req.machine,
      devcontainer_path: req.devcontainerPath,
      location: req.location,
      idle_timeout_minutes: req.idleTimeoutMinutes,
      retention_period_minutes: req.retentionPeriodMinutes,
      env: req.env
    }));
  }

  async start(name: string) { return withBackoff(() => this.octokit.request("POST /user/codespaces/{codespace_name}/start", { codespace_name: name })); }
  async stop(name: string)  { return withBackoff(() => this.octokit.request("POST /user/codespaces/{codespace_name}/stop",  { codespace_name: name })); }
  async delete(name: string){ return withBackoff(() => this.octokit.request("DELETE /user/codespaces/{codespace_name}",      { codespace_name: name })); }

  async userPublicKey() {
    const res = await withBackoff(() => this.octokit.request("GET /user/codespaces/secrets/public-key"));
    return res.data as { key_id: string; key: string };
  }
  async orgPublicKey(org: string) {
    const res = await withBackoff(() => this.octokit.request("GET /orgs/{org}/codespaces/secrets/public-key", { org }));
    return res.data as { key_id: string; key: string };
  }
  async repoPublicKey(repo: RepoRef) {
    const res = await withBackoff(() => this.octokit.request("GET /repos/{owner}/{repo}/codespaces/secrets/public-key", { owner: repo.owner, repo: repo.repo }));
    return res.data as { key_id: string; key: string };
  }

  async putUserSecret(name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() => this.octokit.request("PUT /user/codespaces/secrets/{secret_name}", { secret_name: name, encrypted_value, key_id }));
  }
  async putOrgSecret(org: string, name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() => this.octokit.request("PUT /orgs/{org}/codespaces/secrets/{secret_name}", { org, secret_name: name, encrypted_value, key_id }));
  }
  async putRepoSecret(repo: RepoRef, name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() => this.octokit.request("PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}", { owner: repo.owner, repo: repo.repo, secret_name: name, encrypted_value, key_id }));
  }
}
```

**Create** `packages/sdk-codespaces-adapter/src/gh.ts`

```ts
import { spawn } from "child_process";

export class GhError extends Error { constructor(msg: string, public code?: number, public stdout?: string, public stderr?: string){ super(msg); } }

function cmd() { return process.platform === "win32" ? "gh.exe" : "gh"; }

export async function runGh(args: string[], opts?: { env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<string> {
  const bin = cmd();
  return new Promise((resolve, reject) => {
    const cp = spawn(bin, args, { env: { ...process.env, ...(opts?.env||{}) } });
    let stdout = ""; let stderr = "";
    const t = opts?.timeoutMs ? setTimeout(() => { cp.kill("SIGKILL"); reject(new GhError(`gh timed out after ${opts?.timeoutMs}ms`, undefined, stdout, stderr)); }, opts!.timeoutMs) : null as any;
    cp.stdout.on("data", d => stdout += String(d));
    cp.stderr.on("data", d => stderr += String(d));
    cp.on("error", (e) => reject(new GhError(`failed to spawn gh: ${String(e)}`)));
    cp.on("close", (code) => { if (t) clearTimeout(t); if (code === 0) resolve(stdout.trim()); else reject(new GhError(`gh exited ${code}: ${stderr || stdout}`, code, stdout, stderr)); });
  });
}

export async function setPortVisibility(codespace: string, port: number, visibility: "private"|"org"|"public") {
  // gh codespace ports visibility <port>:<visibility> -c <codespace>
  await runGh(["codespace","ports","visibility", `${port}:${visibility}`, "-c", codespace ]);
}

export async function setPortLabel(codespace: string, port: number, label: string) {
  // gh codespace ports update --port <port> --label "label" -c <codespace>
  await runGh(["codespace","ports","update", "--port", String(port), "--label", label, "-c", codespace ]);
}
```

**Create** `packages/sdk-codespaces-adapter/src/index.ts`

```ts
export * from "./types.js";
export * from "./errors.js";
export { makeOctokit } from "./github-auth.js";
export { GithubClient } from "./github-client.js";
export * as Gh from "./gh.js";
```

**Update (TEMP)** `packages/sdk-codespaces-adapter/src/adapter.ts` (compilable skeleton)

```ts
import { makeOctokit } from "./github-auth.js";
import { GithubClient } from "./github-client.js";
import * as Gh from "./gh.js";
import type { ICodespacesAdapter, AuthMode, CreateCodespaceRequest, CodespaceInfo, Plan } from "./types.js";
import { ValidationError } from "./errors.js";

export class CodespacesAdapter implements ICodespacesAdapter {
  private client?: GithubClient;
  private baseUrl?: string;

  async ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }) {
    const { octokit, baseUrl } = await makeOctokit(auth, opts);
    this.client = new GithubClient(octokit);
    this.baseUrl = baseUrl;
  }

  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }) {
    if (!this.client) throw new ValidationError("auth required");
    return this.client.listCodespaces(params);
  }

  async getCodespaceByName(name: string) {
    if (!this.client) throw new ValidationError("auth required");
    return this.client.getCodespaceByName(name);
  }

  async getCodespace(id: string) {
    if (!this.client) throw new ValidationError("auth required");
    return this.client.getCodespace(id);
  }

  async listMachines(repo: { owner: string; repo: string; ref?: string }) {
    if (!this.client) throw new ValidationError("auth required");
    return this.client.listRepoMachines(repo);
  }

  async planCreate(req: CreateCodespaceRequest): Promise<Plan> {
    if (!this.client) throw new ValidationError("auth required");
    const notes = [] as Plan["notes"];
    const actions = [] as Plan["actions"];

    if (req.schoolMode && req.ports?.some(p => p.visibility !== "private")) {
      notes.push({ level: "error", message: "schoolMode=true forbids public/org ports" });
    }
    const hasDevc = await this.client.devcontainerExists(req.repo, req.devcontainerPath);
    if (!hasDevc && req.devcontainerPath) {
      notes.push({ level: "warn", message: `devcontainer not found at ${req.devcontainerPath}` });
    }
    actions.push({ op: "create-codespace", req });
    if (req.ports?.length) actions.push({ op: "update-ports", req: req.ports, target: { name: req.displayName } });

    return { actions, notes };
  }

  async create(req: CreateCodespaceRequest): Promise<CodespaceInfo> {
    if (!this.client) throw new ValidationError("auth required");
    const res = await this.client.createCodespace({
      repo: req.repo,
      displayName: req.displayName,
      machine: req.machine,
      devcontainerPath: req.devcontainerPath,
      location: req.region,
      idleTimeoutMinutes: req.idleTimeoutMinutes ?? 60,
      retentionPeriodMinutes: req.retentionPeriodMinutes ?? 1440,
      env: req.environmentVariables
    });
    const csName = res.data?.name ?? res.data?.codespace?.name;

    // naive poll (TODO: make configurable)
    const start = Date.now();
    while (Date.now() - start < 180000) {
      const c = await this.getCodespace(csName);
      if (!c) break;
      if (["available","stopped"].includes(c.state)) break;
      await new Promise(r => setTimeout(r, 3000));
    }

    if (req.ports?.length) {
      for (const p of req.ports) {
        if (req.schoolMode && p.visibility !== "private") throw new ValidationError("schoolMode forbids non-private ports");
        await Gh.setPortVisibility(csName, p.port, p.visibility);
        if (p.label) await Gh.setPortLabel(csName, p.port, p.label);
      }
    }

    const fin = await this.getCodespace(csName);
    if (!fin) throw new ValidationError("codespace not found after create");
    return fin;
  }

  async stop(target: { id?: string; name?: string }) { if (!this.client) throw new ValidationError("auth required"); await this.client.stop(target.name ?? target.id!); }
  async start(target: { id?: string; name?: string }) { if (!this.client) throw new ValidationError("auth required"); await this.client.start(target.name ?? target.id!); const cs = await this.getCodespace(target.name ?? target.id!); if (!cs) throw new ValidationError("codespace not found after start"); return cs; }
  async delete(target: { id?: string; name?: string }) { if (!this.client) throw new ValidationError("auth required"); await this.client.delete(target.name ?? target.id!); }

  async setPorts(target: { id?: string; name?: string }, ports: Array<{ port:number; visibility: "private"|"org"|"public"; label?: string }>) {
    const name = target.name ?? target.id; if (!name) throw new ValidationError("name or id required");
    for (const p of ports) { await Gh.setPortVisibility(name, p.port, p.visibility); if (p.label) await Gh.setPortLabel(name, p.port, p.label); }
  }

  async setSecrets(scope: "repo" | "org" | "user", entries: Record<string,string>, ctx?: { repo?: RepoRef; org?: string }) {
    // Implemented in a follow-up using GithubClient publicKey + libsodium sealing (see tests TODO)
    void scope; void entries; void ctx; // TODO
    return;
  }

  async openUrl(target: { id?: string; name?: string }): Promise<string> {
    const cs = await this.getCodespace(target.name ?? target.id!);
    if (!cs) throw new ValidationError("codespace not found");
    return cs.webUrl;
  }
}
```

**Create** placeholder tests (keep compiling):

* `packages/sdk-codespaces-adapter/test/adapter.spec.ts`

```ts
import { describe, it, expect } from "vitest";
describe("codespaces adapter", () => { it("compiles", () => expect(true).toBe(true)); });
```

---

## 2) Concrete patches — Secrets sealing (optional but ready)

**Add** `packages/sdk-codespaces-adapter/src/seal.ts`

```ts
import sodium from "libsodium-wrappers";
export async function sealForGitHub(publicKeyBase64: string, secretValue: string): Promise<{ encrypted_value: string }> {
  await sodium.ready;
  const publicKey = Buffer.from(publicKeyBase64, "base64");
  const messageBytes = Buffer.from(secretValue);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, publicKey);
  return { encrypted_value: Buffer.from(encryptedBytes).toString("base64") };
}
```

**(Optional)** implement `setSecrets` in `adapter.ts` using `GithubClient` + `sealForGitHub`.

---

## 3) Build & smoke

```bash
pnpm -w install
pnpm -w -F @airnub/sdk-codespaces-adapter build
pnpm -w -F @airnub/sdk-codespaces-adapter test
```

If the monorepo root builds packages together, run your usual `pnpm -w build`.

---

## 4) Notes

* `gh` must be present in PATH for port visibility ops; the wrapper provides a clear error if missing.
* UDP is not supported by Codespaces; prefer TCP-only for any sidecar in Codespaces (Neko mux-only pattern).
* Keep `schoolMode=true` as default in higher-level SDKs (Comhrá), flipping only when an instructor opts in.
```
