import { afterEach, describe, expect, it, vi } from "vitest";
import nock from "nock";
import { GitHubClient } from "../src/github-client.js";

class StubAuth {
  token = vi.fn().mockResolvedValue("token");
}

describe("GitHubClient", () => {
  const baseUrl = "https://api.github.com";
  const auth = new StubAuth();
  const client = new GitHubClient(auth as any, { baseUrl });

  afterEach(() => {
    nock.cleanAll();
  });

  it("retrieves codespace by name", async () => {
    nock(baseUrl)
      .get("/user/codespaces/example")
      .reply(200, {
        id: 10,
        name: "example",
        state: "available",
        web_url: "https://github.com/codespaces/example",
        repository: { owner: { login: "airnub" }, name: "lesson" }
      });

    const result = await client.getCodespaceByName("example");
    expect(result?.name).toBe("example");
    expect(result?.repo.owner).toBe("airnub");
  });

  it("reports false when devcontainer path missing", async () => {
    nock(baseUrl)
      .head("/repos/airnub/lesson/contents/.devcontainer/devcontainer.json")
      .query(true)
      .reply(404);

    const exists = await client.pathExists({ owner: "airnub", repo: "lesson" }, ".devcontainer/devcontainer.json");
    expect(exists).toBe(false);
  });

  it("sets repo secrets", async () => {
    const repo = { owner: "airnub", repo: "lesson" };
    const key = Buffer.alloc(32, 1).toString("base64");

    nock(baseUrl)
      .get("/repos/airnub/lesson/codespaces/secrets/public-key")
      .reply(200, { key, key_id: "1" });

    const putScope = nock(baseUrl)
      .put("/repos/airnub/lesson/codespaces/secrets/SECRET", (body) => {
        expect(body.encrypted_value).toBeDefined();
        expect(body.encrypted_value).not.toBe("value");
        expect(body.key_id).toBe("1");
        return true;
      })
      .reply(204);

    await client.setSecrets("repo", { SECRET: "value" }, { repo });
    expect(putScope.isDone()).toBe(true);
  });

  it("updates port visibility", async () => {
    const patch = nock(baseUrl)
      .patch("/user/codespaces/example/ports/8080", (body) => {
        expect(body.visibility).toBe("private");
        expect(body.display_name).toBe("App");
        return true;
      })
      .reply(200, {});

    await client.updatePorts({ name: "example" }, [{ port: 8080, visibility: "private", label: "App" }]);
    expect(patch.isDone()).toBe(true);
  });
});
