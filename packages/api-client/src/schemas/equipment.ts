// ---------------------------------------------------------------------------
// Zod schemas — equipment payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const createEquipmentSchema = z
  .object({
    name: z.string().min(1, "Equipment name is required"),
    serial_number: z.string().min(1, "Serial number is required"),
    equipment_type_id: z.string().min(1, "Equipment type is required"),
    model: z.string().optional(),
    ownership_type: z.enum(["owned", "rented"]),
    supplier_id: z.string().optional(),
    monthly_rent: z.coerce.number().positive("Must be positive").optional(),
    daily_rent: z.coerce.number().positive("Must be positive").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ownership_type === "rented") {
      if (!data.supplier_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Supplier is required for rented equipment",
          path: ["supplier_id"],
        });
      }
      if (data.monthly_rent == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Monthly rent is required for rented equipment",
          path: ["monthly_rent"],
        });
      }
      if (data.daily_rent == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Daily rent is required for rented equipment",
          path: ["daily_rent"],
        });
      }
    }
  });

export const updateEquipmentSchema = z
  .object({
    name: z.string().min(1, "Equipment name is required").optional(),
    serial_number: z.string().min(1, "Serial number is required").optional(),
    equipment_type_id: z.string().min(1).optional(),
    model: z.string().nullable().optional(),
    ownership_type: z.enum(["owned", "rented"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    supplier_id: z.string().nullable().optional(),
    monthly_rent: z.coerce.number().positive().nullable().optional(),
    daily_rent: z.coerce.number().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ownership_type === "rented") {
      if (!data.supplier_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Supplier is required for rented equipment",
          path: ["supplier_id"],
        });
      }
      if (data.monthly_rent == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Monthly rent is required for rented equipment",
          path: ["monthly_rent"],
        });
      }
      if (data.daily_rent == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Daily rent is required for rented equipment",
          path: ["daily_rent"],
        });
      }
    }
  });

export const createEquipmentTypeSchema = z.object({
  name: z.string().min(1, "Type name is required"),
});

export type CreateEquipmentFormData = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentFormData = z.infer<typeof updateEquipmentSchema>;
export type CreateEquipmentTypeFormData = z.infer<typeof createEquipmentTypeSchema>;
