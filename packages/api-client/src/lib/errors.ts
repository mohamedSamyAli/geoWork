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
  // Workers module constraints
  if (combined.includes("workers") && combined.includes("phone"))
    return "A worker with this phone number already exists.";
  if (combined.includes("software") && combined.includes("name"))
    return "Software with this name already exists.";
  if (combined.includes("equipment_brands") && combined.includes("name"))
    return "An equipment brand with this name already exists.";
  if (combined.includes("worker_equipment_skills") && combined.includes("worker_id"))
    return "This equipment skill already exists for the worker.";
  if (combined.includes("worker_software_skills") && combined.includes("worker_id"))
    return "This software skill is already assigned to the worker.";

  // Customers module constraints
  if (combined.includes("customers") && combined.includes("name"))
    return "A customer with this name already exists.";
  if (combined.includes("customer_sites") && combined.includes("name"))
    return "A site with this name already exists for this customer.";

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
