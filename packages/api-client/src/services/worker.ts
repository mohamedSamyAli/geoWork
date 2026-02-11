// ---------------------------------------------------------------------------
// workerService — workers CRUD + skill management + master data
// ---------------------------------------------------------------------------

import type {
  Result,
  Worker,
  WorkerWithSkills,
  WorkerEquipmentSkill,
  WorkerSoftwareSkill,
  CreateWorkerPayload,
  UpdateWorkerPayload,
  AddWorkerEquipmentSkillPayload,
  Software,
  EquipmentBrand,
  CreateSoftwarePayload,
  CreateEquipmentBrandPayload,
  ProficiencyRating,
} from "@repo/types";
import { getSupabase } from "../client";
import {
  createWorkerSchema,
  updateWorkerSchema,
  addWorkerEquipmentSkillSchema,
  createSoftwareSchema,
  createEquipmentBrandSchema,
} from "../schemas/worker";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const workerService = {
  // ---- Worker CRUD -------------------------------------------------------

  async list(
    companyId: string,
    filters?: {
      status?: "active" | "inactive";
      category?: "engineer" | "surveyor" | "assistant";
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Worker[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("workers")
        .select("id, company_id, name, phone, category, salary_month, salary_day, status, created_at, updated_at")
        .eq("company_id", companyId)
        .is("deleted_at", null) // Exclude soft-deleted
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(workerId: string): Promise<Result<WorkerWithSkills>> {
    try {
      const supabase = getSupabase();

      // Get worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("id, company_id, name, phone, category, salary_month, salary_day, status, created_at, updated_at")
        .eq("id", workerId)
        .is("deleted_at", null)
        .single();

      if (workerError) return fail(mapSupabaseError(workerError));

      // Get equipment skills
      const { data: equipmentSkills, error: eqError } = await supabase
        .from("worker_equipment_skills")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (eqError) return fail(mapSupabaseError(eqError));

      // Get software skills with joined software data
      const { data: softwareSkills, error: swError } = await supabase
        .from("worker_software_skills")
        .select(`
          id, worker_id, software_id, created_at,
          software:software (id, name, is_seeded, created_at)
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (swError) return fail(mapSupabaseError(swError));

      return ok({
        ...worker,
        equipment_skills: (equipmentSkills ?? []) as WorkerEquipmentSkill[],
        software_skills: (softwareSkills ?? []).map((s) => ({
          id: s.id,
          worker_id: s.worker_id,
          software_id: s.software_id,
          created_at: s.created_at,
          software: (s as any).software,
        })),
      } as WorkerWithSkills);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreateWorkerPayload): Promise<Result<Worker>> {
    try {
      const parsed = createWorkerSchema.parse(payload);
      const supabase = getSupabase();

      // Create worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .insert({
          company_id: companyId,
          name: parsed.name,
          phone: parsed.phone,
          category: parsed.category,
          salary_month: parsed.salary_month,
          salary_day: parsed.salary_day,
        })
        .select()
        .single();

      if (workerError) return fail(mapSupabaseError(workerError));

      // Add equipment skills if provided
      if (parsed.equipment_skills && parsed.equipment_skills.length > 0) {
        const skillsToInsert = parsed.equipment_skills.map((skill) => ({
          worker_id: worker.id,
          equipment_type: skill.equipment_type,
          equipment_brand: skill.equipment_brand,
          proficiency_rating: skill.proficiency_rating,
        }));

        const { error: skillsError } = await supabase
          .from("worker_equipment_skills")
          .insert(skillsToInsert);

        if (skillsError) return fail(mapSupabaseError(skillsError));
      }

      // Add software skills if provided
      if (parsed.software_skill_ids && parsed.software_skill_ids.length > 0) {
        const skillsToInsert = parsed.software_skill_ids.map((softwareId) => ({
          worker_id: worker.id,
          software_id: softwareId,
        }));

        const { error: swError } = await supabase
          .from("worker_software_skills")
          .insert(skillsToInsert);

        if (swError) return fail(mapSupabaseError(swError));
      }

      return ok(worker as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(workerId: string, payload: UpdateWorkerPayload): Promise<Result<Worker>> {
    try {
      const parsed = updateWorkerSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("workers")
        .update(parsed)
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async archive(workerId: string): Promise<Result<Worker>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("workers")
        .update({ status: "inactive" })
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async reactivate(workerId: string): Promise<Result<Worker>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("workers")
        .update({ status: "active" })
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Skills --------------------------------------------------

  async getEquipmentSkills(workerId: string): Promise<Result<WorkerEquipmentSkill[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async addEquipmentSkill(
    workerId: string,
    payload: AddWorkerEquipmentSkillPayload
  ): Promise<Result<WorkerEquipmentSkill>> {
    try {
      const parsed = addWorkerEquipmentSkillSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .insert({
          worker_id: workerId,
          equipment_type: parsed.equipment_type,
          equipment_brand: parsed.equipment_brand,
          proficiency_rating: parsed.proficiency_rating,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async updateEquipmentSkill(
    skillId: string,
    rating: ProficiencyRating
  ): Promise<Result<WorkerEquipmentSkill>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .update({ proficiency_rating: rating })
        .eq("id", skillId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async removeEquipmentSkill(skillId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("worker_equipment_skills")
        .delete()
        .eq("id", skillId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Software Skills ---------------------------------------------------

  async getSoftwareSkills(
    workerId: string
  ): Promise<Result<Array<WorkerSoftwareSkill & { software: Software }>>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_software_skills")
        .select(`
          id, worker_id, software_id, created_at,
          software:software (id, name, is_seeded, created_at)
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));

      const mapped = (data ?? []).map((s) => ({
        id: s.id,
        worker_id: s.worker_id,
        software_id: s.software_id,
        created_at: s.created_at,
        software: (s as any).software,
      }));

      return ok(mapped as unknown as Array<WorkerSoftwareSkill & { software: Software }>);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async addSoftwareSkill(workerId: string, softwareId: string): Promise<Result<WorkerSoftwareSkill>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_software_skills")
        .insert({
          worker_id: workerId,
          software_id: softwareId,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerSoftwareSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async removeSoftwareSkill(skillId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("worker_software_skills")
        .delete()
        .eq("id", skillId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Master Data (Software & Equipment Brands) -------------------------

  async getSoftwareList(companyId: string): Promise<Result<Software[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("software")
        .select("id, company_id, name, is_seeded, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Software[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createSoftware(companyId: string, payload: CreateSoftwarePayload): Promise<Result<Software>> {
    try {
      const parsed = createSoftwareSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("software")
        .insert({
          company_id: companyId,
          name: parsed.name,
          is_seeded: false,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Software);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getEquipmentBrands(companyId: string): Promise<Result<EquipmentBrand[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_brands")
        .select("id, company_id, name, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentBrand[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createEquipmentBrand(
    companyId: string,
    payload: CreateEquipmentBrandPayload
  ): Promise<Result<EquipmentBrand>> {
    try {
      const parsed = createEquipmentBrandSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("equipment_brands")
        .insert({
          company_id: companyId,
          name: parsed.name,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentBrand);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Types (reusing from equipment module) -------------------

  async getEquipmentTypes(companyId: string): Promise<Result<Array<{ id: string; name: string }>>> {
    // Reuse equipment_types from equipment module
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_types")
        .select("id, company_id, name, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok((data ?? []).map((t) => ({ id: t.id, name: t.name })));
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
