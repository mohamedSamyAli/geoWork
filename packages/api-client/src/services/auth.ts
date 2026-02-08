// ---------------------------------------------------------------------------
// authService — signup, login, logout, session, password reset
// ---------------------------------------------------------------------------

import type { Session } from "@supabase/supabase-js";
import type { Result, SignUpPayload, SignInPayload } from "@repo/types";
import { getSupabase } from "../client";
import { signUpSchema, signInSchema, resetPasswordSchema } from "../schemas/auth";
import { mapAuthError, mapUnknownError, ok, fail } from "../lib/errors";

export const authService = {
  /**
   * Register a new user.
   * Supabase Auth creates the auth.users row; the DB trigger auto-creates
   * the profiles row from raw_user_meta_data.
   */
  async signUp(payload: SignUpPayload): Promise<Result<{ userId: string }>> {
    try {
      const parsed = signUpSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          data: {
            full_name: parsed.full_name,
            phone: parsed.phone ?? "",
          },
        },
      });

      if (error) return fail(mapAuthError(error));
      if (!data.user) return fail({ code: "SIGNUP_NO_USER", message: "Signup succeeded but no user returned" });

      return ok({ userId: data.user.id });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Sign in with email + password. Returns the session. */
  async signIn(payload: SignInPayload): Promise<Result<Session>> {
    try {
      const parsed = signInSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      });

      if (error) return fail(mapAuthError(error));
      return ok(data.session);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Sign out the current user. */
  async signOut(): Promise<Result<null>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) return fail(mapAuthError(error));
      return ok(null);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Get the current session (null if not logged in). */
  async getSession(): Promise<Result<Session | null>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      if (error) return fail(mapAuthError(error));
      return ok(data.session);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Send a password reset email. */
  async resetPassword(email: string): Promise<Result<null>> {
    try {
      const parsed = resetPasswordSchema.parse({ email });
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.email);
      if (error) return fail(mapAuthError(error));
      return ok(null);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /**
   * Subscribe to auth state changes (login, logout, token refresh).
   * Returns an unsubscribe function.
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    const supabase = getSupabase();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => data.subscription.unsubscribe();
  },
};
