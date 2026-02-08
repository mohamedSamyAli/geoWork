// ---------------------------------------------------------------------------
// Error mapping — convert Supabase errors to ApiError
// ---------------------------------------------------------------------------

import type { AuthError } from "@supabase/supabase-js";
import type { ApiError, Result } from "@repo/types";

/** Map a Supabase AuthError into our standardised ApiError shape. */
export function mapAuthError(err: AuthError): ApiError {
  return {
    code: err.code ?? "AUTH_ERROR",
    message: err.message,
    status: err.status,
  };
}

/** Map a Supabase PostgREST / generic error into ApiError. */
export function mapSupabaseError(err: {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}): ApiError {
  return {
    code: err.code ?? "DB_ERROR",
    message: err.message,
    status: undefined,
    details: err.details ?? err.hint,
  };
}

/** Wrap an unknown thrown value into ApiError. */
export function mapUnknownError(err: unknown): ApiError {
  if (err instanceof Error) {
    return { code: "UNKNOWN", message: err.message };
  }
  return { code: "UNKNOWN", message: String(err) };
}

/** Shorthand to build a failure Result. */
export function fail<T>(error: ApiError): Result<T> {
  return { data: null, error };
}

/** Shorthand to build a success Result. */
export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}
