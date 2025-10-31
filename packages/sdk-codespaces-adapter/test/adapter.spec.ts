import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodespacesAdapter } from "../src/adapter.js";
import type { CodespaceInfo } from "../src/types.js";

function makeCodespace(state: string): CodespaceInfo {
  return {
    id: "1",
    name: "lesson",
    state,
    webUrl: "https://codespaces.example/lesson",
    createdAt: new Date().toISOString(),
    repo: { owner: "airnub", repo: "lesson" }
  };
}

describe("CodespacesAdapter", () => {
  const adapter = new CodespacesAdapter({ pollIntervalMs: 1, pollTimeoutMs: 100 });
  const client: any = {
    ensureRepoAccess: vi.fn(),
    setSecrets: vi.fn(),
    createCodespace: vi.fn(),
    getCodespaceByName: vi.fn(),
    updatePorts: vi.fn(),
    listCodespaces: vi.fn(),
    getCodespace: vi.fn(),
    listMachines: vi.fn(),
    stopCodespace: vi.fn(),
    startCodespace: vi.fn(),
    deleteCodespace: vi.fn()
  };

  beforeEach(() => {
    Object.values(client).forEach((value) => {
      if (typeof value.mockReset === "function") {
        value.mockReset();
      }
    });
    (adapter as any).client = client;
  });

  it("creates codespace, waits for availability, updates ports", async () => {
    vi.useFakeTimers();

    client.ensureRepoAccess.mockResolvedValue(undefined);
    client.setSecrets.mockResolvedValue(undefined);
    client.createCodespace.mockResolvedValue(makeCodespace("starting"));
    client.getCodespaceByName
      .mockResolvedValueOnce(makeCodespace("starting"))
      .mockResolvedValueOnce(makeCodespace("available"))
      .mockResolvedValue(makeCodespace("available"));
    client.updatePorts.mockResolvedValue(undefined);

    const createPromise = adapter.create({
      repo: { owner: "airnub", repo: "lesson" },
      displayName: "lesson",
      machine: "standardLinux32",
      ports: [{ port: 8080, label: "App" }],
      secrets: { TOKEN: "value" }
    });

    await vi.runAllTimersAsync();
    const result = await createPromise;

    expect(client.ensureRepoAccess).toHaveBeenCalled();
    expect(client.setSecrets).toHaveBeenCalledWith("repo", { TOKEN: "value" }, { repo: { owner: "airnub", repo: "lesson" } });
    expect(client.updatePorts).toHaveBeenCalledWith({ name: "lesson" }, [{ port: 8080, visibility: "private", label: "App" }]);
    expect(result.state).toBe("available");

    vi.useRealTimers();
  });
});
