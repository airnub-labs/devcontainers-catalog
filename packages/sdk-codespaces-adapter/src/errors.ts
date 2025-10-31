export class AuthError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class RateLimitError extends Error {
  constructor(message: string, public retryAfterSec?: number) {
    super(message);
  }
}
