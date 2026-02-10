// ---------------------------------------------------------------------------
// Contract: partnerService — partner CRUD
// Pattern: matches existing companyService in @repo/api-client
// ---------------------------------------------------------------------------

import type {
  Result,
  Partner,
  PartnerWithEquipmentCount,
  LinkedEquipment,
  CreatePartnerPayload,
  UpdatePartnerPayload,
} from "@repo/types";

export const partnerService = {
  /** List all partners for the user's company. Supports search filter. */
  async list(companyId: string, filters?: {
    search?: string;
  }): Promise<Result<PartnerWithEquipmentCount[]>> { /* ... */ },

  /** Get a single partner by ID with linked equipment list (with percentages). */
  async getById(partnerId: string): Promise<Result<Partner & { equipment: LinkedEquipment[] }>> { /* ... */ },

  /** Create a new partner. */
  async create(companyId: string, payload: CreatePartnerPayload): Promise<Result<Partner>> { /* ... */ },

  /** Update an existing partner. */
  async update(partnerId: string, payload: UpdatePartnerPayload): Promise<Result<Partner>> { /* ... */ },

  /** Delete a partner. Removes all equipment_partners rows for this partner (ownership recalculated). */
  async delete(partnerId: string): Promise<Result<void>> { /* ... */ },
};

// ---------------------------------------------------------------------------
// React Query hooks contract
// ---------------------------------------------------------------------------

// usePartnerList(companyId, filters?) → useQuery → partnerService.list()
// usePartnerDetail(partnerId) → useQuery → partnerService.getById()
// useCreatePartnerMutation() → useMutation → partnerService.create()
// useUpdatePartnerMutation() → useMutation → partnerService.update()
// useDeletePartnerMutation() → useMutation → partnerService.delete()

// ---------------------------------------------------------------------------
// Query keys to add to queryKeys object
// ---------------------------------------------------------------------------

// partners: {
//   all: (companyId: string) => ["partners", companyId] as const,
//   detail: (id: string) => ["partners", "detail", id] as const,
// },
