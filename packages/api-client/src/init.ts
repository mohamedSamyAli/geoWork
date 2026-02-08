// ---------------------------------------------------------------------------
// initApi — one-shot initialiser called from each app's entry point
// ---------------------------------------------------------------------------

import { type Env, initEnv } from "@repo/config";
import { initSupabase } from "./client";

/**
 * Initialise all shared infrastructure.
 *
 * Call exactly ONCE from your app entry:
 *
 * ```ts
 * // Web  (Vite)
 * initApi({
 *   SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
 *   SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
 * });
 *
 * // Mobile (Expo)
 * initApi({
 *   SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
 *   SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
 * });
 * ```
 */
export function initApi(env: Env): void {
  initEnv(env);
  initSupabase();
}
