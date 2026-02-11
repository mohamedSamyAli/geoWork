// ---------------------------------------------------------------------------
// Zod schemas — supplier payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").optional(),
  phone: z.string().nullable().optional(),
});

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
