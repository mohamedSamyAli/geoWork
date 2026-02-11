// ---------------------------------------------------------------------------
// Zod schemas — partner payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Partner name is required"),
  phone: z.string().optional(),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(1, "Partner name is required").optional(),
  phone: z.string().nullable().optional(),
});

export type CreatePartnerFormData = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerFormData = z.infer<typeof updatePartnerSchema>;
