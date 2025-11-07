export interface LessonEnv {
  apiVersion: string; // "airnub.devcontainers/v1"
  kind: "LessonEnv" | string;
  metadata: {
    org: string;
    course?: string;
    lesson?: string;
    name?: string; // generic env name for non-edu users
  };
  spec: {
    base_preset: string; // e.g. "full", "node-pnpm", "python"
    image_tag_strategy?: string; // e.g. "ubuntu-24.04"
    vscode_extensions?: string[];
    enable_copilot?: boolean;
    settings?: Record<string, unknown>;
    services?: Array<{ name: string; vars?: Record<string, string> }>;
    emit_aggregate_compose?: boolean;
    env?: Record<string, string>;
    secrets_placeholders?: string[];
    starter_repo?: { url: string; path?: string };
    // future: resources, policies, etc.
  };
}
