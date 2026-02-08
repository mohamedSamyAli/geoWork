// ---------------------------------------------------------------------------
// Supabase client singleton
// ---------------------------------------------------------------------------
// Never import env directly (no import.meta.env, no expo-constants).
// Reads env through getEnv() which was initialised by the host app.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@repo/config";

let _supabase: SupabaseClient | null = null;

/** Create and cache the Supabase client. Called by initApi(). */
export function initSupabase(): SupabaseClient {
  const env = getEnv();
  _supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  return _supabase;
}

/** Get the initialised Supabase client. Throws if initApi() was not called. */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    throw new Error(
      "[api-client] Supabase not initialised. Call initApi() from your app entry point first."
    );
  }
  return _supabase;
}
