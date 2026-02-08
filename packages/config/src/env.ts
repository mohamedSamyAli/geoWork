// ---------------------------------------------------------------------------
// @repo/config — cross-platform environment configuration
// ---------------------------------------------------------------------------
// Apps must call initEnv() ONCE at startup, passing platform-specific values:
//   - Web  → from import.meta.env (Vite)
//   - Mobile → from process.env.EXPO_PUBLIC_* (Expo)
// Shared packages then call getEnv() to read the validated singleton.
// ---------------------------------------------------------------------------

import { z } from "zod";

// ---- Schema ----------------------------------------------------------------

export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
});

export type Env = z.infer<typeof EnvSchema>;

// ---- Singleton -------------------------------------------------------------

let _env: Env | null = null;

/**
 * Validate and store the environment singleton.
 * Call this exactly once from your app's entry point.
 */
export function initEnv(raw: Env): Env {
  const parsed = EnvSchema.parse(raw);
  _env = parsed;
  return parsed;
}

/**
 * Retrieve the validated environment.
 * Throws a helpful error if initEnv() was not called yet.
 */
export function getEnv(): Env {
  if (!_env) {
    throw new Error(
      "[config] Environment not initialised. " +
        "Call initEnv({ SUPABASE_URL, SUPABASE_ANON_KEY }) from your app entry point."
    );
  }
  return _env;
}
