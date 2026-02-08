// ---------------------------------------------------------------------------
// companyService — company CRUD + onboarding (company + owner membership)
// ---------------------------------------------------------------------------

import type {
  Result,
  Company,
  CompanyMember,
  CreateCompanyPayload,
  OnboardingResult,
} from "@repo/types";
import { getSupabase } from "../client";
import { createCompanySchema } from "../schemas/company";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const companyService = {
  /**
   * Full onboarding flow: create a company + insert the current user as owner.
   *
   * Uses the `create_company_with_owner` RPC (see migration 04) for atomicity.
   * Falls back to two sequential inserts if the RPC doesn't exist yet.
   */
  async onboard(payload: CreateCompanyPayload): Promise<Result<OnboardingResult>> {
    try {
      const parsed = createCompanySchema.parse(payload);
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fail({ code: "NOT_AUTHENTICATED", message: "No authenticated user" });

      // Try the atomic RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "create_company_with_owner",
        { company_name: parsed.name }
      );

      if (!rpcError && rpcData) {
        return ok(rpcData as OnboardingResult);
      }

      // Fallback: two inserts (non-atomic but works without the RPC)
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .insert({ name: parsed.name })
        .select("id")
        .single();

      if (companyErr) return fail(mapSupabaseError(companyErr));

      const { data: member, error: memberErr } = await supabase
        .from("company_members")
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: "owner" as const,
        })
        .select("id")
        .single();

      if (memberErr) return fail(mapSupabaseError(memberErr));

      return ok({
        company_id: company.id,
        membership_id: member.id,
      });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Get all companies the current user belongs to. */
  async getMyCompanies(): Promise<Result<(CompanyMember & { company: Company })[]>> {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fail({ code: "NOT_AUTHENTICATED", message: "No authenticated user" });

      const { data, error } = await supabase
        .from("company_members")
        .select(`
          id, user_id, company_id, role, created_at,
          company:companies ( id, name, created_at, updated_at )
        `)
        .eq("user_id", user.id);

      if (error) return fail(mapSupabaseError(error));
      return ok(data as unknown as (CompanyMember & { company: Company })[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Get a single company by ID (must be a member). */
  async getCompanyById(companyId: string): Promise<Result<Company>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, created_at, updated_at")
        .eq("id", companyId)
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Company);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  /** Update a company (must be owner — enforced by RLS). */
  async updateCompany(
    companyId: string,
    payload: CreateCompanyPayload
  ): Promise<Result<Company>> {
    try {
      const parsed = createCompanySchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("companies")
        .update({ name: parsed.name })
        .eq("id", companyId)
        .select("id, name, created_at, updated_at")
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Company);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
