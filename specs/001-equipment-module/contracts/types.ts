// ---------------------------------------------------------------------------
// Contract: New types to add to @repo/types/src/index.ts
// These are the TypeScript interfaces for the equipment module entities.
// ---------------------------------------------------------------------------

// ---- Enums ----------------------------------------------------------------

export type OwnershipType = "owned" | "rented";
export type EquipmentStatus = "active" | "inactive";

// ---- DB row types ---------------------------------------------------------

export interface EquipmentType {
  id: string;
  company_id: string | null; // null = system default
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

// ---- DTOs (payloads) ------------------------------------------------------

export interface CreateEquipmentPayload {
  name: string;
  serial_number: string;
  equipment_type_id: string;
  model?: string;
  ownership_type: OwnershipType;
  // Required when ownership_type = 'rented'
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

// ---- Composite / joined types ---------------------------------------------

/** Equipment with its type name resolved (for list views) */
export interface EquipmentWithType extends Equipment {
  equipment_type: EquipmentType;
}

/** Equipment with type + supplier info (for rented equipment detail) */
export interface EquipmentWithDetails extends EquipmentWithType {
  supplier: Supplier | null;
}

/** Equipment partner with partner details (for ownership display) */
export interface EquipmentPartnerWithDetails extends EquipmentPartner {
  partner: Partner;
}

/** Supplier with linked equipment count (for supplier list) */
export interface SupplierWithEquipmentCount extends Supplier {
  equipment_count: number;
}

/** Partner with linked equipment count (for partner list) */
export interface PartnerWithEquipmentCount extends Partner {
  equipment_count: number;
}

/** Equipment summary for supplier/partner detail pages */
export interface LinkedEquipment {
  id: string;
  name: string;
  serial_number: string;
  model: string | null;
  // For supplier detail: rental costs
  monthly_rent?: number | null;
  daily_rent?: number | null;
  // For partner detail: ownership percentage
  percentage?: number;
}

/** Custom equipment type created by the company */
export interface CreateEquipmentTypePayload {
  name: string;
}
