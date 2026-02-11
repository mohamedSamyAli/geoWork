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
  // Unique constraint violations → user-friendly messages
  if (err.code === "23505") {
    const friendly = mapUniqueConstraintMessage(err.message, err.details);
    return { code: "DUPLICATE", message: friendly, status: 409 };
  }

  return {
    code: err.code ?? "DB_ERROR",
    message: err.message,
    status: undefined,
    details: err.details ?? err.hint,
  };
}

function mapUniqueConstraintMessage(message: string, details?: string): string {
  const combined = `${message} ${details ?? ""}`.toLowerCase();

  if (combined.includes("serial_number"))
    return "An equipment record with this serial number already exists.";
  if (combined.includes("suppliers") && combined.includes("name"))
    return "A supplier with this name already exists.";
  if (combined.includes("partners") && combined.includes("name"))
    return "A partner with this name already exists.";

  return "A record with these details already exists.";
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
