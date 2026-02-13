// ---------------------------------------------------------------------------
// customerService — customers CRUD + contacts + sites management
// ---------------------------------------------------------------------------

import type {
  Result,
  Customer,
  CustomerContact,
  CustomerSite,
  CustomerWithDetails,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CreateCustomerContactPayload,
  UpdateCustomerContactPayload,
  CreateCustomerSitePayload,
  UpdateCustomerSitePayload,
} from "@repo/types";
import { getSupabase } from "../client";
import {
  createCustomerSchema,
  updateCustomerSchema,
  createCustomerContactSchema,
  updateCustomerContactSchema,
  createCustomerSiteSchema,
  updateCustomerSiteSchema,
} from "../schemas/customer";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

/** Clean empty strings to null for optional DB fields. */
const emptyToNull = (val: string | null | undefined): string | null =>
  val === "" || val === undefined ? null : val;

export const customerService = {
  // ---- Customer CRUD -------------------------------------------------------

  async list(
    companyId: string,
    filters?: {
      status?: "active" | "inactive" | "prospect";
      customer_type?: "individual" | "company" | "government";
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Customer[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("customers")
        .select(
          "id, company_id, name, customer_type, status, phone, email, address, notes, created_at, updated_at, deleted_at"
        )
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.customer_type) query = query.eq("customer_type", filters.customer_type);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));
      return ok(data as Customer[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(customerId: string): Promise<Result<CustomerWithDetails>> {
    try {
      const supabase = getSupabase();

      // Parallel: customer + contacts + sites
      const [customerRes, contactsRes, sitesRes] = await Promise.all([
        supabase
          .from("customers")
          .select(
            "id, company_id, name, customer_type, status, phone, email, address, notes, created_at, updated_at, deleted_at"
          )
          .eq("id", customerId)
          .is("deleted_at", null)
          .single(),
        supabase
          .from("customer_contacts")
          .select("*")
          .eq("customer_id", customerId)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("customer_sites")
          .select("*")
          .eq("customer_id", customerId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true }),
      ]);

      if (customerRes.error) return fail(mapSupabaseError(customerRes.error));
      if (contactsRes.error) return fail(mapSupabaseError(contactsRes.error));
      if (sitesRes.error) return fail(mapSupabaseError(sitesRes.error));

      return ok({
        ...customerRes.data,
        contacts: (contactsRes.data ?? []) as CustomerContact[],
        sites: (sitesRes.data ?? []) as CustomerSite[],
      } as CustomerWithDetails);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreateCustomerPayload): Promise<Result<Customer>> {
    try {
      const parsed = createCustomerSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("customers")
        .insert({
          company_id: companyId,
          name: parsed.name,
          customer_type: parsed.customer_type,
          status: parsed.status,
          phone: emptyToNull(parsed.phone),
          email: emptyToNull(parsed.email),
          address: emptyToNull(parsed.address),
          notes: emptyToNull(parsed.notes),
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Customer);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(customerId: string, payload: UpdateCustomerPayload): Promise<Result<Customer>> {
    try {
      const parsed = updateCustomerSchema.parse(payload);
      const supabase = getSupabase();

      // Clean empty strings to null for optional fields
      const cleanPayload: Record<string, unknown> = {};
      if (parsed.name !== undefined) cleanPayload.name = parsed.name;
      if (parsed.customer_type !== undefined) cleanPayload.customer_type = parsed.customer_type;
      if (parsed.status !== undefined) cleanPayload.status = parsed.status;
      if (parsed.phone !== undefined) cleanPayload.phone = emptyToNull(parsed.phone);
      if (parsed.email !== undefined) cleanPayload.email = emptyToNull(parsed.email);
      if (parsed.address !== undefined) cleanPayload.address = emptyToNull(parsed.address);
      if (parsed.notes !== undefined) cleanPayload.notes = emptyToNull(parsed.notes);

      const { data, error } = await supabase
        .from("customers")
        .update(cleanPayload)
        .eq("id", customerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Customer);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async softDelete(customerId: string): Promise<Result<Customer>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", customerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Customer);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Customer Contacts ---------------------------------------------------

  async getContacts(customerId: string): Promise<Result<CustomerContact[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customer_contacts")
        .select("*")
        .eq("customer_id", customerId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerContact[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createContact(
    customerId: string,
    payload: CreateCustomerContactPayload
  ): Promise<Result<CustomerContact>> {
    try {
      const parsed = createCustomerContactSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("customer_contacts")
        .insert({
          customer_id: customerId,
          name: parsed.name,
          phone: parsed.phone,
          role: emptyToNull(parsed.role),
          department: emptyToNull(parsed.department),
          email: emptyToNull(parsed.email),
          is_primary: parsed.is_primary,
          notes: emptyToNull(parsed.notes),
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerContact);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async updateContact(
    contactId: string,
    payload: UpdateCustomerContactPayload
  ): Promise<Result<CustomerContact>> {
    try {
      const parsed = updateCustomerContactSchema.parse(payload);
      const supabase = getSupabase();

      const cleanPayload: Record<string, unknown> = {};
      if (parsed.name !== undefined) cleanPayload.name = parsed.name;
      if (parsed.phone !== undefined) cleanPayload.phone = parsed.phone;
      if (parsed.role !== undefined) cleanPayload.role = emptyToNull(parsed.role);
      if (parsed.department !== undefined) cleanPayload.department = emptyToNull(parsed.department);
      if (parsed.email !== undefined) cleanPayload.email = emptyToNull(parsed.email);
      if (parsed.is_primary !== undefined) cleanPayload.is_primary = parsed.is_primary;
      if (parsed.notes !== undefined) cleanPayload.notes = emptyToNull(parsed.notes);

      const { data, error } = await supabase
        .from("customer_contacts")
        .update(cleanPayload)
        .eq("id", contactId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerContact);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async deleteContact(contactId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_contacts")
        .delete()
        .eq("id", contactId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Customer Sites ------------------------------------------------------

  async getSites(customerId: string): Promise<Result<CustomerSite[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customer_sites")
        .select("*")
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerSite[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createSite(
    customerId: string,
    payload: CreateCustomerSitePayload
  ): Promise<Result<CustomerSite>> {
    try {
      const parsed = createCustomerSiteSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("customer_sites")
        .insert({
          customer_id: customerId,
          name: parsed.name,
          address: emptyToNull(parsed.address),
          city: emptyToNull(parsed.city),
          gps_coordinates: emptyToNull(parsed.gps_coordinates),
          landmarks: emptyToNull(parsed.landmarks),
          notes: emptyToNull(parsed.notes),
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerSite);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async updateSite(
    siteId: string,
    payload: UpdateCustomerSitePayload
  ): Promise<Result<CustomerSite>> {
    try {
      const parsed = updateCustomerSiteSchema.parse(payload);
      const supabase = getSupabase();

      const cleanPayload: Record<string, unknown> = {};
      if (parsed.name !== undefined) cleanPayload.name = parsed.name;
      if (parsed.address !== undefined) cleanPayload.address = emptyToNull(parsed.address);
      if (parsed.city !== undefined) cleanPayload.city = emptyToNull(parsed.city);
      if (parsed.gps_coordinates !== undefined)
        cleanPayload.gps_coordinates = emptyToNull(parsed.gps_coordinates);
      if (parsed.landmarks !== undefined) cleanPayload.landmarks = emptyToNull(parsed.landmarks);
      if (parsed.notes !== undefined) cleanPayload.notes = emptyToNull(parsed.notes);

      const { data, error } = await supabase
        .from("customer_sites")
        .update(cleanPayload)
        .eq("id", siteId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerSite);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async softDeleteSite(siteId: string): Promise<Result<CustomerSite>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customer_sites")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", siteId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as CustomerSite);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
