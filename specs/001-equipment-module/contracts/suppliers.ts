// ---------------------------------------------------------------------------
// Contract: supplierService — supplier CRUD
// Pattern: matches existing companyService in @repo/api-client
// ---------------------------------------------------------------------------

import type {
  Result,
  Supplier,
  SupplierWithEquipmentCount,
  LinkedEquipment,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "@repo/types";

export const supplierService = {
  /** List all suppliers for the user's company. Supports search filter. */
  async list(companyId: string, filters?: {
    search?: string;
  }): Promise<Result<SupplierWithEquipmentCount[]>> { /* ... */ },

  /** Get a single supplier by ID with linked equipment list. */
  async getById(supplierId: string): Promise<Result<Supplier & { equipment: LinkedEquipment[] }>> { /* ... */ },

  /** Create a new supplier. */
  async create(companyId: string, payload: CreateSupplierPayload): Promise<Result<Supplier>> { /* ... */ },

  /** Update an existing supplier. */
  async update(supplierId: string, payload: UpdateSupplierPayload): Promise<Result<Supplier>> { /* ... */ },

  /** Delete a supplier (fails if linked equipment exists — FR-020). */
  async delete(supplierId: string): Promise<Result<void>> { /* ... */ },
};

// ---------------------------------------------------------------------------
// React Query hooks contract
// ---------------------------------------------------------------------------

// useSupplierList(companyId, filters?) → useQuery → supplierService.list()
// useSupplierDetail(supplierId) → useQuery → supplierService.getById()
// useCreateSupplierMutation() → useMutation → supplierService.create()
// useUpdateSupplierMutation() → useMutation → supplierService.update()
// useDeleteSupplierMutation() → useMutation → supplierService.delete()

// ---------------------------------------------------------------------------
// Query keys to add to queryKeys object
// ---------------------------------------------------------------------------

// suppliers: {
//   all: (companyId: string) => ["suppliers", companyId] as const,
//   detail: (id: string) => ["suppliers", "detail", id] as const,
// },
