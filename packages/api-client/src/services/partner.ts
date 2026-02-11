// ---------------------------------------------------------------------------
// partnerService — partner CRUD
// ---------------------------------------------------------------------------

import type {
  Result,
  Partner,
  PartnerWithEquipmentCount,
  LinkedEquipment,
  CreatePartnerPayload,
  UpdatePartnerPayload,
} from "@repo/types";
import { getSupabase } from "../client";
import { createPartnerSchema, updatePartnerSchema } from "../schemas/partner";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const partnerService = {
  async list(
    companyId: string,
    filters?: { search?: string; limit?: number; offset?: number }
  ): Promise<Result<PartnerWithEquipmentCount[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("partners")
        .select(`
          id, company_id, name, phone, created_at, updated_at,
          equipment_partners ( count )
        `, { count: "exact" })
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));

      const mapped = (data as unknown as (Partner & { equipment_partners: { count: number }[] })[]).map(
        ({ equipment_partners: epArr, ...partner }) => ({
          ...partner,
          equipment_count: epArr?.[0]?.count ?? 0,
        })
      );

      return ok(mapped);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(
    partnerId: string
  ): Promise<Result<Partner & { equipment: LinkedEquipment[] }>> {
    try {
      const supabase = getSupabase();

      // Fetch partner
      const { data: partner, error: partnerErr } = await supabase
        .from("partners")
        .select("id, company_id, name, phone, created_at, updated_at")
        .eq("id", partnerId)
        .single();

      if (partnerErr) return fail(mapSupabaseError(partnerErr));

      // Fetch linked equipment via equipment_partners join
      const { data: epData, error: epErr } = await supabase
        .from("equipment_partners")
        .select(`
          percentage,
          equipment:equipment ( id, name, serial_number, model )
        `)
        .eq("partner_id", partnerId);

      if (epErr) return fail(mapSupabaseError(epErr));

      const equipment: LinkedEquipment[] = (epData as unknown as { percentage: number; equipment: LinkedEquipment }[]).map(
        (ep) => ({
          ...ep.equipment,
          percentage: ep.percentage,
        })
      );

      return ok({
        ...(partner as Partner),
        equipment,
      });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreatePartnerPayload): Promise<Result<Partner>> {
    try {
      const parsed = createPartnerSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("partners")
        .insert({
          company_id: companyId,
          name: parsed.name,
          phone: parsed.phone ?? null,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Partner);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(partnerId: string, payload: UpdatePartnerPayload): Promise<Result<Partner>> {
    try {
      const parsed = updatePartnerSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("partners")
        .update(parsed)
        .eq("id", partnerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Partner);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async delete(partnerId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
