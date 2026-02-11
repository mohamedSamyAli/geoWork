// ---------------------------------------------------------------------------
// equipmentService — equipment CRUD + partner ownership + equipment types
// ---------------------------------------------------------------------------

import type {
  Result,
  Equipment,
  EquipmentWithType,
  EquipmentWithDetails,
  EquipmentPartnerWithDetails,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  AddEquipmentPartnerPayload,
  UpdateEquipmentPartnerPayload,
  EquipmentType,
  CreateEquipmentTypePayload,
} from "@repo/types";
import { getSupabase } from "../client";
import { createEquipmentSchema, updateEquipmentSchema, createEquipmentTypeSchema } from "../schemas/equipment";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const equipmentService = {
  // ---- Equipment CRUD -----------------------------------------------------

  async list(
    companyId: string,
    filters?: {
      status?: "active" | "inactive";
      ownership_type?: "owned" | "rented";
      equipment_type_id?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<EquipmentWithType[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("equipment")
        .select(`
          id, company_id, name, serial_number, equipment_type_id, model,
          ownership_type, status, supplier_id, monthly_rent, daily_rent,
          created_at, updated_at,
          equipment_type:equipment_types ( id, company_id, name, created_at )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.ownership_type) query = query.eq("ownership_type", filters.ownership_type);
      if (filters?.equipment_type_id) query = query.eq("equipment_type_id", filters.equipment_type_id);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));
      return ok(data as unknown as EquipmentWithType[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(equipmentId: string): Promise<Result<EquipmentWithDetails>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          id, company_id, name, serial_number, equipment_type_id, model,
          ownership_type, status, supplier_id, monthly_rent, daily_rent,
          created_at, updated_at,
          equipment_type:equipment_types ( id, company_id, name, created_at ),
          supplier:suppliers ( id, company_id, name, phone, created_at, updated_at )
        `)
        .eq("id", equipmentId)
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as unknown as EquipmentWithDetails);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreateEquipmentPayload): Promise<Result<Equipment>> {
    try {
      const parsed = createEquipmentSchema.parse(payload);
      const supabase = getSupabase();

      const insertData: Record<string, unknown> = {
        company_id: companyId,
        name: parsed.name,
        serial_number: parsed.serial_number,
        equipment_type_id: parsed.equipment_type_id,
        model: parsed.model ?? null,
        ownership_type: parsed.ownership_type,
      };

      if (parsed.ownership_type === "rented") {
        insertData.supplier_id = parsed.supplier_id;
        insertData.monthly_rent = parsed.monthly_rent;
        insertData.daily_rent = parsed.daily_rent;
      }

      const { data, error } = await supabase
        .from("equipment")
        .insert(insertData)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Equipment);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(equipmentId: string, payload: UpdateEquipmentPayload): Promise<Result<Equipment>> {
    try {
      const parsed = updateEquipmentSchema.parse(payload);
      const supabase = getSupabase();

      // When switching to "owned", explicitly null-out rental fields so the DB
      // CHECK constraint (ownership_type='owned' ⇒ supplier/rent IS NULL) is satisfied.
      const updateData: Record<string, unknown> = { ...parsed };
      if (parsed.ownership_type === "owned") {
        updateData.supplier_id = null;
        updateData.monthly_rent = null;
        updateData.daily_rent = null;
      }

      const { data, error } = await supabase
        .from("equipment")
        .update(updateData)
        .eq("id", equipmentId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Equipment);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async archive(equipmentId: string): Promise<Result<Equipment>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment")
        .update({ status: "inactive" })
        .eq("id", equipmentId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Equipment);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async reactivate(equipmentId: string): Promise<Result<Equipment>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment")
        .update({ status: "active" })
        .eq("id", equipmentId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Equipment);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Partner Ownership ----------------------------------------

  async listPartners(equipmentId: string): Promise<Result<EquipmentPartnerWithDetails[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_partners")
        .select(`
          id, equipment_id, partner_id, percentage, created_at,
          partner:partners ( id, company_id, name, phone, created_at, updated_at )
        `)
        .eq("equipment_id", equipmentId)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as unknown as EquipmentPartnerWithDetails[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async addPartner(
    equipmentId: string,
    payload: AddEquipmentPartnerPayload
  ): Promise<Result<{ id: string }>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_partners")
        .insert({
          equipment_id: equipmentId,
          partner_id: payload.partner_id,
          percentage: payload.percentage,
        })
        .select("id")
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as { id: string });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async updatePartnerPercentage(
    equipmentPartnerId: string,
    payload: UpdateEquipmentPartnerPayload
  ): Promise<Result<{ id: string }>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_partners")
        .update({ percentage: payload.percentage })
        .eq("id", equipmentPartnerId)
        .select("id")
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as { id: string });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async removePartner(equipmentPartnerId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("equipment_partners")
        .delete()
        .eq("id", equipmentPartnerId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Types ----------------------------------------------------

  async listTypes(companyId: string): Promise<Result<EquipmentType[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_types")
        .select("id, company_id, name, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentType[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createType(companyId: string, payload: CreateEquipmentTypePayload): Promise<Result<EquipmentType>> {
    try {
      const parsed = createEquipmentTypeSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("equipment_types")
        .insert({ company_id: companyId, name: parsed.name })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentType);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async deleteType(typeId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("equipment_types")
        .delete()
        .eq("id", typeId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
