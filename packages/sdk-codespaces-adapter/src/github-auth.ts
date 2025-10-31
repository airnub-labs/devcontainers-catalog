import { request as octokitRequest } from "@octokit/request";
import { createAppAuth } from "@octokit/auth-app";
import { AuthError } from "./errors.js";
import type { AuthMode } from "./types.js";

type TokenCacheEntry = { token: string; expiresAt?: number };

type AuthOptions = { baseUrl?: string };

export class GitHubAuthManager {
  private activeAuth?: AuthMode;
  private cache = new Map<string, TokenCacheEntry>();
  private readonly request = this.options.baseUrl
    ? octokitRequest.defaults({ baseUrl: this.options.baseUrl })
    : octokitRequest;

  constructor(private readonly options: AuthOptions = {}) {}

  async ensure(auth: AuthMode): Promise<string> {
    this.activeAuth = auth;
    return this.getTokenFor(auth);
  }

  async token(): Promise<string> {
    if (!this.activeAuth) {
      throw new AuthError("Authentication not established. Call ensureAuth first.");
    }
    return this.getTokenFor(this.activeAuth);
  }

  private cacheKey(auth: AuthMode): string {
    return auth.kind === "pat"
      ? `pat:${auth.token}`
      : `app:${auth.appId}:${auth.installationId}`;
  }

  private isExpired(entry: TokenCacheEntry | undefined): boolean {
    if (!entry) return true;
    if (!entry.expiresAt) return false;
    return Date.now() + 60_000 >= entry.expiresAt; // refresh 1 minute early
  }

  private async getTokenFor(auth: AuthMode): Promise<string> {
    const key = this.cacheKey(auth);
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.token;
    }

    if (auth.kind === "pat") {
      if (!auth.token) {
        throw new AuthError("Personal access token is empty.");
      }
      const entry: TokenCacheEntry = { token: auth.token };
      this.cache.set(key, entry);
      return entry.token;
    }

    const authFn = createAppAuth({
      appId: auth.appId,
      privateKey: auth.privateKeyPem,
      installationId: auth.installationId,
      request: this.request
    });

    try {
      const result = await authFn({ type: "installation" });
      const entry: TokenCacheEntry = {
        token: result.token,
        expiresAt: result.expiresAt ? new Date(result.expiresAt).getTime() : undefined
      };
      this.cache.set(key, entry);
      return entry.token;
    } catch (error) {
      throw new AuthError(`Failed to acquire GitHub App installation token: ${String(error)}`);
    }
  }
}
