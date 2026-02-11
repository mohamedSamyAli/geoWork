// ---------------------------------------------------------------------------
// @repo/types — shared type definitions for web + mobile
// ---------------------------------------------------------------------------

// ---- Generic result / error types -----------------------------------------

/** Standardised API error shape used across all services. */
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Discriminated-union result type.
 * Every service function returns Result<T> so callers handle success/error
 * uniformly without try/catch.
 */
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

// ---- Enums ----------------------------------------------------------------

export type AppRole = "owner" | "member";
export type OwnershipType = "owned" | "rented";
export type EquipmentStatus = "active" | "inactive";

// ---- DB row types ---------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  created_at: string;
}

// ---- Auth DTOs ------------------------------------------------------------

export interface SignUpPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  company_name: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface CreateCompanyPayload {
  name: string;
}

/** Returned by the onboarding RPC: company + owner membership in one shot. */
export interface OnboardingResult {
  company_id: string;
  membership_id: string;
}

// ---- Session helpers ------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
}

export interface ActiveMembership {
  companyId: string;
  companyName: string;
  role: AppRole;
}

// ---- Equipment module: DB row types ---------------------------------------

export interface EquipmentType {
  id: string;
  company_id: string | null;
  name: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  company_id: string;
  name: string;
  serial_number: string;
  equipment_type_id: string;
  model: string | null;
  ownership_type: OwnershipType;
  status: EquipmentStatus;
  supplier_id: string | null;
  monthly_rent: number | null;
  daily_rent: number | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentPartner {
  id: string;
  equipment_id: string;
  partner_id: string;
  percentage: number;
  created_at: string;
}

// ---- Equipment module: DTOs / payloads ------------------------------------

export interface CreateEquipmentPayload {
  name: string;
  serial_number: string;
  equipment_type_id: string;
  model?: string;
  ownership_type: OwnershipType;
  supplier_id?: string;
  monthly_rent?: number;
  daily_rent?: number;
}

export interface UpdateEquipmentPayload {
  name?: string;
  serial_number?: string;
  equipment_type_id?: string;
  model?: string | null;
  ownership_type?: OwnershipType;
  status?: EquipmentStatus;
  supplier_id?: string | null;
  monthly_rent?: number | null;
  daily_rent?: number | null;
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  phone?: string | null;
}

export interface CreatePartnerPayload {
  name: string;
  phone?: string;
}

export interface UpdatePartnerPayload {
  name?: string;
  phone?: string | null;
}

export interface AddEquipmentPartnerPayload {
  partner_id: string;
  percentage: number;
}

export interface UpdateEquipmentPartnerPayload {
  percentage: number;
}

// ---- Equipment module: Composite / joined types ---------------------------

export interface EquipmentWithType extends Equipment {
  equipment_type: EquipmentType;
}

export interface EquipmentWithDetails extends EquipmentWithType {
  supplier: Supplier | null;
}

export interface EquipmentPartnerWithDetails extends EquipmentPartner {
  partner: Partner;
}

export interface SupplierWithEquipmentCount extends Supplier {
  equipment_count: number;
}

export interface PartnerWithEquipmentCount extends Partner {
  equipment_count: number;
}

export interface LinkedEquipment {
  id: string;
  name: string;
  serial_number: string;
  model: string | null;
  monthly_rent?: number | null;
  daily_rent?: number | null;
  percentage?: number;
}

export interface CreateEquipmentTypePayload {
  name: string;
}
