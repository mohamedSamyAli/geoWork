// ---------------------------------------------------------------------------
// Zod schemas — customer payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

// ---- Customer Schemas ------------------------------------------------------

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name too long"),
  customer_type: z.enum(["individual", "company", "government"]).default("company"),
  status: z.enum(["active", "inactive", "prospect"]).default("active"),
  phone: z.string().max(20, "Phone too long").optional().or(z.literal("")),
  email: z
    .string()
    .max(100, "Email too long")
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  customer_type: z.enum(["individual", "company", "government"]).optional(),
  status: z.enum(["active", "inactive", "prospect"]).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().max(100).email().optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ---- Contact Schemas -------------------------------------------------------

export const createCustomerContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().min(1, "Phone is required").max(20, "Phone too long"),
  role: z.string().max(100, "Role too long").optional().or(z.literal("")),
  department: z.string().max(100, "Department too long").optional().or(z.literal("")),
  email: z
    .string()
    .max(100, "Email too long")
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  is_primary: z.boolean().default(false),
  notes: z.string().optional().or(z.literal("")),
});

export const updateCustomerContactSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  role: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  email: z.string().max(100).email().optional().nullable().or(z.literal("")),
  is_primary: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

// ---- Site Schemas ----------------------------------------------------------

export const createCustomerSiteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name too long"),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  city: z.string().max(100, "City too long").optional().or(z.literal("")),
  gps_coordinates: z
    .string()
    .max(50, "GPS coordinates too long")
    .optional()
    .or(z.literal("")),
  landmarks: z.string().max(200, "Landmarks too long").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const updateCustomerSiteSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  gps_coordinates: z.string().max(50).optional().nullable(),
  landmarks: z.string().max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ---- Inferred Form Data Types ----------------------------------------------

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
export type CreateCustomerContactFormData = z.infer<typeof createCustomerContactSchema>;
export type UpdateCustomerContactFormData = z.infer<typeof updateCustomerContactSchema>;
export type CreateCustomerSiteFormData = z.infer<typeof createCustomerSiteSchema>;
export type UpdateCustomerSiteFormData = z.infer<typeof updateCustomerSiteSchema>;
