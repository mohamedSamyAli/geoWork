// ---------------------------------------------------------------------------
// Contract: equipmentService — equipment CRUD + partner ownership management
// Pattern: matches existing companyService in @repo/api-client
// ---------------------------------------------------------------------------

import type {
  Result,
  Equipment,
  EquipmentWithDetails,
  EquipmentPartnerWithDetails,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  AddEquipmentPartnerPayload,
  UpdateEquipmentPartnerPayload,
  EquipmentType,
  CreateEquipmentTypePayload,
  EquipmentWithType,
} from "@repo/types";

export const equipmentService = {
  // ---- Equipment CRUD -----------------------------------------------------

  /** List all equipment for the user's company. Supports filtering by status, type, ownership. */
  async list(companyId: string, filters?: {
    status?: "active" | "inactive";
    ownership_type?: "owned" | "rented";
    equipment_type_id?: string;
    search?: string;
  }): Promise<Result<EquipmentWithType[]>> { /* ... */ },

  /** Get a single equipment by ID with full details (type, supplier if rented). */
  async getById(equipmentId: string): Promise<Result<EquipmentWithDetails>> { /* ... */ },

  /** Create a new equipment record. Validates rental fields if ownership_type = 'rented'. */
  async create(companyId: string, payload: CreateEquipmentPayload): Promise<Result<Equipment>> { /* ... */ },

  /** Update an equipment record. Handles ownership type transitions. */
  async update(equipmentId: string, payload: UpdateEquipmentPayload): Promise<Result<Equipment>> { /* ... */ },

  /** Archive equipment (set status to 'inactive'). */
  async archive(equipmentId: string): Promise<Result<Equipment>> { /* ... */ },

  /** Reactivate equipment (set status to 'active'). */
  async reactivate(equipmentId: string): Promise<Result<Equipment>> { /* ... */ },

  // ---- Equipment Partner Ownership ----------------------------------------

  /** List all partners with percentages for a given equipment. */
  async listPartners(equipmentId: string): Promise<Result<EquipmentPartnerWithDetails[]>> { /* ... */ },

  /** Add a partner with ownership percentage to an equipment. */
  async addPartner(equipmentId: string, payload: AddEquipmentPartnerPayload): Promise<Result<{ id: string }>> { /* ... */ },

  /** Update a partner's ownership percentage. */
  async updatePartnerPercentage(
    equipmentPartnerId: string,
    payload: UpdateEquipmentPartnerPayload
  ): Promise<Result<{ id: string }>> { /* ... */ },

  /** Remove a partner from an equipment's ownership. */
  async removePartner(equipmentPartnerId: string): Promise<Result<void>> { /* ... */ },

  // ---- Equipment Types ----------------------------------------------------

  /** List all equipment types visible to the user (system + company custom). */
  async listTypes(companyId: string): Promise<Result<EquipmentType[]>> { /* ... */ },

  /** Create a custom equipment type for the company. */
  async createType(companyId: string, payload: CreateEquipmentTypePayload): Promise<Result<EquipmentType>> { /* ... */ },

  /** Delete a custom equipment type (only if not in use). */
  async deleteType(typeId: string): Promise<Result<void>> { /* ... */ },
};

// ---------------------------------------------------------------------------
// React Query hooks contract
// ---------------------------------------------------------------------------

// useEquipmentList(companyId, filters?) → useQuery → equipmentService.list()
// useEquipmentDetail(equipmentId) → useQuery → equipmentService.getById()
// useCreateEquipmentMutation() → useMutation → equipmentService.create()
// useUpdateEquipmentMutation() → useMutation → equipmentService.update()
// useArchiveEquipmentMutation() → useMutation → equipmentService.archive()
// useReactivateEquipmentMutation() → useMutation → equipmentService.reactivate()
// useEquipmentPartners(equipmentId) → useQuery → equipmentService.listPartners()
// useAddEquipmentPartnerMutation() → useMutation → equipmentService.addPartner()
// useUpdateEquipmentPartnerMutation() → useMutation → equipmentService.updatePartnerPercentage()
// useRemoveEquipmentPartnerMutation() → useMutation → equipmentService.removePartner()
// useEquipmentTypes(companyId) → useQuery → equipmentService.listTypes()
// useCreateEquipmentTypeMutation() → useMutation → equipmentService.createType()

// ---------------------------------------------------------------------------
// Query keys to add to queryKeys object
// ---------------------------------------------------------------------------

// equipment: {
//   all: (companyId: string) => ["equipment", companyId] as const,
//   detail: (id: string) => ["equipment", "detail", id] as const,
//   partners: (equipmentId: string) => ["equipment", equipmentId, "partners"] as const,
//   types: (companyId: string) => ["equipment-types", companyId] as const,
// },
