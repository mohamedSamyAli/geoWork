// ---------------------------------------------------------------------------
// profileService — current user's profile CRUD
// ---------------------------------------------------------------------------

import type { Result, Profile, UpdateProfilePayload } from "@repo/types";
import { getSupabase } from "../client";
import { updateProfileSchema } from "../schemas/auth";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const profileService = {
  /** Fetch the currently authenticated user's profile. */
  async getMyProfile(): Promise<Result<Profile>> {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fail({ code: "NOT_AUTHENTICATED", message: "No authenticated user" });

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Profile);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Update the currently authenticated user's profile. */
  async updateMyProfile(payload: UpdateProfilePayload): Promise<Result<Profile>> {
    try {
      const parsed = updateProfileSchema.parse(payload);
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fail({ code: "NOT_AUTHENTICATED", message: "No authenticated user" });

      const { data, error } = await supabase
        .from("profiles")
        .update(parsed)
        .eq("id", user.id)
        .select("id, full_name, phone, avatar_url, created_at, updated_at")
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Profile);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
