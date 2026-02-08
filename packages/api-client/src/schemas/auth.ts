// ---------------------------------------------------------------------------
// Zod schemas — auth & profile payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Full name cannot be empty").optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().url("Must be a valid URL").nullable().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
