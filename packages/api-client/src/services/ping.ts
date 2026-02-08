// ---------------------------------------------------------------------------
// pingService — minimal connectivity check (no DB migration needed)
// ---------------------------------------------------------------------------

import type { Result } from "@repo/types";
import { getSupabase } from "../client";

export interface PingData {
  ok: boolean;
  timestamp: string;
  /** null when no user is logged in — that's still a successful ping. */
  session: unknown;
}

export const pingService = {
  /**
   * Calls supabase.auth.getSession() as a lightweight connectivity test.
   * Returns Result<PingData> so callers never need try/catch.
   */
  async ping(): Promise<Result<PingData>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          data: null,
          error: {
            code: "PING_FAILED",
            message: error.message,
            status: 500,
          },
        };
      }

      const result = {
        ok: true,
        timestamp: new Date().toISOString(),
        session: data.session,
      };

      console.log("[ping] Supabase connection successful", result.timestamp);

      return { data: result, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: "PING_ERROR",
          message: err instanceof Error ? err.message : "Unknown error",
          status: 500,
        },
      };
    }
  },
};
