import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubAuthManager } from "../src/github-auth.js";

vi.mock("@octokit/auth-app", () => ({
  createAppAuth: vi.fn()
}));

const authAppModule = (await import("@octokit/auth-app")) as any;

describe("GitHubAuthManager", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns PAT tokens directly", async () => {
    const manager = new GitHubAuthManager();
    await expect(manager.ensure({ kind: "pat", token: "abc" })).resolves.toBe("abc");
    await expect(manager.token()).resolves.toBe("abc");
  });

  it("caches installation tokens per base URL", async () => {
    const authFn = vi.fn().mockResolvedValue({ token: "install", expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    authAppModule.createAppAuth.mockReturnValue(authFn);
    const manager = new GitHubAuthManager();

    await expect(
      manager.ensure({
        kind: "github-app",
        appId: 1,
        installationId: 2,
        privateKeyPem: "-----BEGIN"
      })
    ).resolves.toBe("install");
    await expect(manager.token()).resolves.toBe("install");
    expect(authFn).toHaveBeenCalledTimes(1);

    await expect(
      manager.ensure(
        {
          kind: "github-app",
          appId: 1,
          installationId: 2,
          privateKeyPem: "-----BEGIN"
        },
        { baseUrl: "https://github.enterprise" }
      )
    ).resolves.toBe("install");
    expect(authAppModule.createAppAuth).toHaveBeenCalledTimes(2);
  });
});
