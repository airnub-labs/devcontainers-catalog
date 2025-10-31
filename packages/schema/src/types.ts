export type PortPrivacy = 'PRIVATE' | 'COURSE' | 'PUBLIC';

export interface WorkspacePort {
  port: number;
  label: string;
  purpose: string;
  recommendedPrivacy: PortPrivacy;
}

export interface WorkspaceEnvVar {
  name: string;
  description?: string;
  required?: boolean;
}

export interface WorkspacePaths {
  devcontainer: string;
  compose?: string;
  readme: string;
  classroomBrowser?: string;
}

export type CodespacesFallback = 'tcp-mux' | 'https-ws';

export interface WorkspaceNotes {
  prefersUDP?: boolean;
  codespacesFallback?: CodespacesFallback;
  other?: string;
}

export interface WorkspaceManifest {
  schemaVersion: string;
  stackId: string;
  catalogCommit: string;
  browsers: string[];
  ports: WorkspacePort[];
  env: WorkspaceEnvVar[];
  paths: WorkspacePaths;
  notes: WorkspaceNotes;
}

export interface GeneratorOutput {
  outDir: string;
  manifestPath: string;
  manifestJson: WorkspaceManifest;
  zipPath?: string;
}

export interface GeneratorInput {
  stackId: string;
  browsers: string[];
  overrides?: Record<string, unknown>;
  pin: string;
}
