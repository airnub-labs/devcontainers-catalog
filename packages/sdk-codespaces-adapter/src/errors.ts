/**
 * Thrown when authentication fails or credentials are invalid.
 *
 * @example
 * ```typescript
 * try {
 *   await adapter.ensureAuth({ kind: "pat", token: "invalid" });
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     console.error("Authentication failed", error.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export class AuthError extends Error {}

/**
 * Thrown when a requested resource does not exist.
 *
 * @example
 * ```typescript
 * const codespace = await adapter.getCodespace("missing");
 * if (!codespace) {
 *   throw new NotFoundError("Codespace not found");
 * }
 * ```
 *
 * @public
 */
export class NotFoundError extends Error {}

/**
 * Thrown when input validation fails.
 *
 * @example
 * ```typescript
 * try {
 *   await adapter.stop({});
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error("Validation error", error.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export class ValidationError extends Error {}

/**
 * Thrown when GitHub API rate limit is exceeded.
 *
 * The SDK retries with exponential backoff. If limits persist after multiple
 * attempts, this error includes the `retryAfterSec` hint when available.
 *
 * @example
 * ```typescript
 * try {
 *   await adapter.listCodespaces();
 * } catch (error) {
 *   if (error instanceof RateLimitError) {
 *     console.error(`Rate limit hit. Retry after ${error.retryAfterSec ?? "unknown"} seconds`);
 *   }
 * }
 * ```
 *
 * @public
 */
export class RateLimitError extends Error {
  /**
   * @param message - Error message
   * @param retryAfterSec - Seconds until rate limit resets (from Retry-After header)
   */
  constructor(message: string, public retryAfterSec?: number) {
    super(message);
  }
}
