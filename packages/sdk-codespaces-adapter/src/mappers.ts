import { CodespaceInfo, RepoRef } from "./types.js";

function repoFromResponse(data: any): RepoRef {
  const repo = data.repository ?? {};
  const owner = repo.owner ?? {};
  return {
    owner: owner.login ?? owner.name ?? "",
    repo: repo.name ?? "",
    ref: data.git_status?.ref
  };
}

export function mapCodespace(data: any): CodespaceInfo {
  return {
    id: String(data.id ?? data.codespace_id ?? ""),
    name: data.display_name ?? data.name ?? "",
    state: data.state ?? "",
    webUrl: data.web_url ?? data.url ?? "",
    createdAt: data.created_at ?? new Date().toISOString(),
    lastUsedAt: data.last_used_at ?? undefined,
    region: data.region,
    machine: data.machine,
    repo: repoFromResponse(data)
  };
}
