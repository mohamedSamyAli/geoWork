// ---------------------------------------------------------------------------
// @repo/types — shared type definitions for web + mobile
// ---------------------------------------------------------------------------

/** Standardised API error shape used across all services. */
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Discriminated-union result type.
 * Every service function returns Result<T> so callers handle success/error
 * uniformly without try/catch.
 */
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };
