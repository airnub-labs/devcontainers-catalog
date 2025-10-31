import { describe, expect, it, vi } from "vitest";
import { buildCreatePlan } from "../src/plan.js";
import type { CreateCodespaceRequest } from "../src/types.js";

class FakeClient {
  ensureRepoAccess = vi.fn().mockResolvedValue(undefined);
  pathExists = vi.fn().mockResolvedValue(true);
  listMachines = vi.fn().mockResolvedValue(["standardLinux32"]);
}

describe("buildCreatePlan", () => {
  it("returns actions and notes", async () => {
    const client = new FakeClient();
    const req: CreateCodespaceRequest = {
      repo: { owner: "airnub", repo: "lesson" },
      devcontainerPath: ".devcontainer/devcontainer.json",
      machine: "standardLinux32",
      displayName: "lesson-codespace",
      environmentVariables: { NEKO_PASSWORD: "password" },
      ports: [
        { port: 8080, label: "App" },
        { port: 8081, visibility: "public", label: "Browser" }
      ],
      secrets: { TOKEN: "value" }
    };

    const plan = await buildCreatePlan(client as any, req);

    expect(plan.actions[0]).toMatchObject({ op: "create-codespace" });
    expect(plan.actions).toContainEqual({
      op: "set-secrets",
      scope: "repo",
      entries: ["TOKEN"],
      repo: req.repo
    });
    expect(plan.notes.some((note) => note.level === "warn")).toBe(true);
  });

  it("throws when devcontainer missing", async () => {
    const client = new FakeClient();
    client.pathExists.mockResolvedValue(false);
    const req: CreateCodespaceRequest = {
      repo: { owner: "airnub", repo: "lesson" },
      devcontainerPath: "missing.json"
    };

    await expect(buildCreatePlan(client as any, req)).rejects.toThrow();
  });
});
