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

// ---- Workers module: DB row types -----------------------------------------

export type WorkerCategory = "engineer" | "surveyor" | "assistant";
export type WorkerStatus = "active" | "inactive";
export type ProficiencyRating = 1 | 2 | 3 | 4 | 5;

export interface Worker {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  category: WorkerCategory;
  salary_month: number;
  salary_day: number;
  status: WorkerStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Software {
  id: string;
  company_id: string | null;
  name: string;
  is_seeded: boolean;
  created_at: string;
}

export interface EquipmentBrand {
  id: string;
  company_id: string | null;
  name: string;
  created_at: string;
}

export interface WorkerEquipmentSkill {
  id: string;
  worker_id: string;
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
  created_at: string;
}

export interface WorkerSoftwareSkill {
  id: string;
  worker_id: string;
  software_id: string;
  created_at: string;
}

// ---- Workers module: Composite / joined types ------------------------------

export interface WorkerWithSkills extends Worker {
  equipment_skills: WorkerEquipmentSkill[];
  software_skills: Array<WorkerSoftwareSkill & { software: Software }>;
}

export interface WorkerWithEquipmentSkills extends Worker {
  equipment_skills: WorkerEquipmentSkill[];
}

export interface WorkerWithSoftwareSkills extends Worker {
  software_skills: Array<WorkerSoftwareSkill & { software_name: string }>;
}

// ---- Workers module: DTOs / payloads --------------------------------------

export interface CreateWorkerPayload {
  name: string;
  phone: string;
  category: WorkerCategory;
  salary_month: number;
  salary_day: number;
  equipment_skills?: Array<{
    equipment_type: string;
    equipment_brand: string;
    proficiency_rating: ProficiencyRating;
  }>;
  software_skill_ids?: string[];
}

export interface UpdateWorkerPayload {
  name?: string;
  phone?: string;
  category?: WorkerCategory;
  salary_month?: number;
  salary_day?: number;
  status?: WorkerStatus;
}

export interface AddWorkerEquipmentSkillPayload {
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
}

export interface UpdateWorkerEquipmentSkillPayload {
  proficiency_rating: ProficiencyRating;
}

export interface CreateSoftwarePayload {
  name: string;
}

export interface CreateEquipmentBrandPayload {
  name: string;
}

// ---- Customers module: Enums ------------------------------------------------

export type CustomerType = "individual" | "company" | "government";
export type CustomerStatus = "active" | "inactive" | "prospect";

// ---- Customers module: DB row types -----------------------------------------

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  customer_type: CustomerType;
  status: CustomerStatus;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  role: string | null;
  department: string | null;
  phone: string;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerSite {
  id: string;
  customer_id: string;
  name: string;
  address: string | null;
  city: string | null;
  gps_coordinates: string | null;
  landmarks: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---- Customers module: Composite / joined types -----------------------------

export interface CustomerWithContacts extends Customer {
  contacts: CustomerContact[];
}

export interface CustomerWithSites extends Customer {
  sites: CustomerSite[];
}

export interface CustomerWithDetails extends Customer {
  contacts: CustomerContact[];
  sites: CustomerSite[];
}

// ---- Customers module: DTOs / payloads --------------------------------------

export interface CreateCustomerPayload {
  name: string;
  customer_type?: CustomerType;
  status?: CustomerStatus;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  customer_type?: CustomerType;
  status?: CustomerStatus;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CreateCustomerContactPayload {
  name: string;
  phone: string;
  role?: string;
  department?: string;
  email?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateCustomerContactPayload {
  name?: string;
  phone?: string;
  role?: string | null;
  department?: string | null;
  email?: string | null;
  is_primary?: boolean;
  notes?: string | null;
}

export interface CreateCustomerSitePayload {
  name: string;
  address?: string;
  city?: string;
  gps_coordinates?: string;
  landmarks?: string;
  notes?: string;
}

export interface UpdateCustomerSitePayload {
  name?: string;
  address?: string | null;
  city?: string | null;
  gps_coordinates?: string | null;
  landmarks?: string | null;
  notes?: string | null;
}
