import { request as octokitRequest } from "@octokit/request";
import { createAppAuth } from "@octokit/auth-app";
import { AuthError } from "./errors.js";
import type { AuthMode } from "./types.js";

type TokenCacheEntry = { token: string; expiresAt?: number };

type AuthOptions = { baseUrl?: string };

export class GitHubAuthManager {
  private activeAuth?: AuthMode;
  private cache = new Map<string, TokenCacheEntry>();
  private baseUrl?: string;

  constructor(private readonly options: AuthOptions = {}) {
    this.baseUrl = options.baseUrl;
  }

  async ensure(auth: AuthMode, opts?: AuthOptions): Promise<string> {
    if (opts && Object.prototype.hasOwnProperty.call(opts, "baseUrl")) {
      this.baseUrl = opts.baseUrl;
    } else if (this.baseUrl === undefined) {
      this.baseUrl = this.options.baseUrl;
    }
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
    const base = this.baseUrl ? `@${this.baseUrl}` : "";
    return auth.kind === "pat"
      ? `pat:${auth.token}${base}`
      : `app:${auth.appId}:${auth.installationId}${base}`;
  }

  private isExpired(entry: TokenCacheEntry | undefined): boolean {
    if (!entry) return true;
    if (!entry.expiresAt) return false;
    return Date.now() + 60_000 >= entry.expiresAt; // refresh 1 minute early
  }

  private requestFactory() {
    return this.baseUrl ? octokitRequest.defaults({ baseUrl: this.baseUrl }) : octokitRequest;
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
      request: this.requestFactory()
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
