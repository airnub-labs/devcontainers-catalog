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
