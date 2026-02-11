// ---------------------------------------------------------------------------
// Zod schemas — worker payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const createWorkerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    phone: z.string().min(1, "Phone is required"),
    category: z.enum(["engineer", "surveyor", "assistant"], {
      required_error: "Category is required",
    }),
    salary_month: z.coerce
      .number({
        invalid_type_error: "Monthly salary must be a number",
      })
      .nonnegative("Monthly salary must be non-negative"),
    salary_day: z.coerce
      .number({
        invalid_type_error: "Daily salary must be a number",
      })
      .nonnegative("Daily salary must be non-negative"),
    equipment_skills: z
      .array(
        z.object({
          equipment_type: z.string().min(1, "Equipment type is required"),
          equipment_brand: z.string().min(1, "Equipment brand is required"),
          proficiency_rating: z
            .number({
              invalid_type_error: "Proficiency rating must be a number",
            })
            .int("Proficiency rating must be an integer")
            .min(1, "Proficiency rating must be at least 1")
            .max(5, "Proficiency rating must be at most 5"),
        })
      )
      .optional(),
    software_skill_ids: z.array(z.string().uuid("Invalid software ID")).optional(),
  })
  .refine((data) => data.salary_month > 0 || data.salary_day > 0, {
    message: "At least one salary must be greater than 0",
    path: ["salary_month"],
  });

export const updateWorkerSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(1).optional(),
    category: z.enum(["engineer", "surveyor", "assistant"]).optional(),
    salary_month: z.coerce.number().nonnegative().optional(),
    salary_day: z.coerce.number().nonnegative().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine(
    (data) => {
      // If both salaries are being updated, ensure at least one is positive
      if (data.salary_month !== undefined && data.salary_day !== undefined) {
        return data.salary_month > 0 || data.salary_day > 0;
      }
      return true;
    },
    {
      message: "At least one salary must be greater than 0",
      path: ["salary_month"],
    }
  );

export const addWorkerEquipmentSkillSchema = z.object({
  equipment_type: z.string().min(1, "Equipment type is required"),
  equipment_brand: z.string().min(1, "Equipment brand is required"),
  proficiency_rating: z
    .number({
      invalid_type_error: "Proficiency rating must be a number",
    })
    .int("Proficiency rating must be an integer")
    .min(1, "Proficiency rating must be at least 1")
    .max(5, "Proficiency rating must be at most 5"),
});

export const updateWorkerEquipmentSkillSchema = z.object({
  proficiency_rating: z
    .number({
      invalid_type_error: "Proficiency rating must be a number",
    })
    .int("Proficiency rating must be an integer")
    .min(1, "Proficiency rating must be at least 1")
    .max(5, "Proficiency rating must be at most 5"),
});

export const createSoftwareSchema = z.object({
  name: z.string().min(1, "Software name is required").max(100, "Name too long"),
});

export const createEquipmentBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100, "Name too long"),
});

// Form data types (inferred from schemas)
export type CreateWorkerFormData = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerFormData = z.infer<typeof updateWorkerSchema>;
export type AddWorkerEquipmentSkillFormData = z.infer<typeof addWorkerEquipmentSkillSchema>;
export type UpdateWorkerEquipmentSkillFormData = z.infer<typeof updateWorkerEquipmentSkillSchema>;
export type CreateSoftwareFormData = z.infer<typeof createSoftwareSchema>;
export type CreateEquipmentBrandFormData = z.infer<typeof createEquipmentBrandSchema>;
