export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };

export type RepoRef = { owner: string; repo: string; ref?: string };
export type Region = string;
export type PortVisibility = "private" | "org" | "public";

export type PortRequest = { port: number; visibility: PortVisibility; label?: string };

export type CreateCodespaceRequest = {
  repo: RepoRef;
  devcontainerPath?: string; // path to .devcontainer/devcontainer.json
  machine?: string; // codespaces machine type
  region?: Region; // optional region
  displayName?: string; // human-readable name
  idleTimeoutMinutes?: number; // default 60
  retentionPeriodMinutes?: number; // default 1440
  environmentVariables?: Record<string, string>;
  secrets?: Record<string, string>; // plaintext at call time; adapter encrypts per-scope
  ports?: PortRequest[];
  startImmediately?: boolean; // default true
  schoolMode?: boolean; // default true → enforce private ports only
};

export type CodespaceInfo = {
  id: string;
  name: string;
  state: string; // available|starting|stopped|...
  webUrl: string;
  createdAt: string; // ISO
  lastUsedAt?: string; // ISO
  region?: Region;
  machine?: string;
  repo: RepoRef;
};

export type PlanNote = { level: "info" | "warn" | "error"; message: string };
export type Plan = {
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: PortRequest[]; target: { id?: string; name?: string } }
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

  setPorts(target: { id?: string; name?: string }, ports: PortRequest[]): Promise<void>;
  setSecrets(
    scope: "repo" | "org" | "user",
    entries: Record<string, string>,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void>;

  openUrl(target: { id?: string; name?: string }): Promise<string>;
}

export type AdapterOptions = {
  baseUrl?: string;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
};
