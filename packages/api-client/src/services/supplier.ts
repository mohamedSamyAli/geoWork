// ---------------------------------------------------------------------------
// supplierService — supplier CRUD
// ---------------------------------------------------------------------------

import type {
  Result,
  Supplier,
  SupplierWithEquipmentCount,
  LinkedEquipment,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "@repo/types";
import { getSupabase } from "../client";
import { createSupplierSchema, updateSupplierSchema } from "../schemas/supplier";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const supplierService = {
  async list(
    companyId: string,
    filters?: { search?: string; limit?: number; offset?: number }
  ): Promise<Result<SupplierWithEquipmentCount[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("suppliers")
        .select(`
          id, company_id, name, phone, created_at, updated_at,
          equipment ( count )
        `, { count: "exact" })
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));

      const mapped = (data as unknown as (Supplier & { equipment: { count: number }[] })[]).map(
        ({ equipment: eqArr, ...supplier }) => ({
          ...supplier,
          equipment_count: eqArr?.[0]?.count ?? 0,
        })
      );

      return ok(mapped);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(
    supplierId: string
  ): Promise<Result<Supplier & { equipment: LinkedEquipment[] }>> {
    try {
      const supabase = getSupabase();

      // Fetch supplier
      const { data: supplier, error: supplierErr } = await supabase
        .from("suppliers")
        .select("id, company_id, name, phone, created_at, updated_at")
        .eq("id", supplierId)
        .single();

      if (supplierErr) return fail(mapSupabaseError(supplierErr));

      // Fetch linked equipment
      const { data: equipment, error: equipmentErr } = await supabase
        .from("equipment")
        .select("id, name, serial_number, model, monthly_rent, daily_rent")
        .eq("supplier_id", supplierId)
        .order("name", { ascending: true });

      if (equipmentErr) return fail(mapSupabaseError(equipmentErr));

      return ok({
        ...(supplier as Supplier),
        equipment: (equipment ?? []) as LinkedEquipment[],
      });
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreateSupplierPayload): Promise<Result<Supplier>> {
    try {
      const parsed = createSupplierSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          company_id: companyId,
          name: parsed.name,
          phone: parsed.phone ?? null,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Supplier);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(supplierId: string, payload: UpdateSupplierPayload): Promise<Result<Supplier>> {
    try {
      const parsed = updateSupplierSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("suppliers")
        .update(parsed)
        .eq("id", supplierId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Supplier);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async delete(supplierId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
