// ---------------------------------------------------------------------------
// @repo/types — shared type definitions for web + mobile
// ---------------------------------------------------------------------------

// ---- Generic result / error types -----------------------------------------

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

// ---- Enums ----------------------------------------------------------------

export type AppRole = "owner" | "member";

// ---- DB row types ---------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  created_at: string;
}

// ---- Auth DTOs ------------------------------------------------------------

export interface SignUpPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface CreateCompanyPayload {
  name: string;
}

/** Returned by the onboarding RPC: company + owner membership in one shot. */
export interface OnboardingResult {
  company_id: string;
  membership_id: string;
}

// ---- Session helpers ------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
}

export interface ActiveMembership {
  companyId: string;
  companyName: string;
  role: AppRole;
}
