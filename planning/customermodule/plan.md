# Customers Module - Detailed Implementation Plan

**Module:** 003-customers-module
**Date:** 2026-02-13
**Status:** Ready for Implementation
**PRD:** [prd.md](prd.md)

---

## Overview

This plan breaks the Customers Module into **12 sequential tasks**, each producing a working increment. Tasks are ordered by dependency: shared types first, then API layer, then Web UI, then Mobile UI.

**Database migrations are already staged** — no DB work needed.

**Platform coverage:** Web (Tasks 7-8) + Mobile/Expo (Tasks 9-12).

---

## Task 1: Add Shared Types to `@repo/types`

**Objective:** Define Customer, CustomerContact, CustomerSite TypeScript interfaces and payload types.
**File:** `packages/types/src/index.ts`
**Estimated Complexity:** Low
**Prerequisites:** None
**Depends On:** Nothing
**Unlocks:** Tasks 2, 3, 4

### Implementation Steps

#### Step 1.1: Add Customer Enums

Append after the Workers section (after line 345) in `packages/types/src/index.ts`:

```typescript
// ---- Customers module: Enums ------------------------------------------------

export type CustomerType = "individual" | "company" | "government";
export type CustomerStatus = "active" | "inactive" | "prospect";
```

#### Step 1.2: Add Customer DB Row Types

```typescript
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
```

#### Step 1.3: Add Composite Types

```typescript
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
```

#### Step 1.4: Add Payload Types

```typescript
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
```

### Validation

- [ ] TypeScript compiles with no errors in `packages/types`
- [ ] All types are exported from `packages/types/src/index.ts`

### Files Modified

| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Add ~110 lines of Customer types at end |

---

## Task 2: Add Query Keys for Customers

**Objective:** Extend the `queryKeys` factory with customers, contacts, and sites keys.
**File:** `packages/api-client/src/lib/query-keys.ts`
**Estimated Complexity:** Low
**Prerequisites:** None
**Depends On:** Nothing
**Unlocks:** Task 4

### Implementation Steps

#### Step 2.1: Add customers key group

Add after the `workers` block in `packages/api-client/src/lib/query-keys.ts`:

```typescript
customers: {
  all: (companyId: string) => ["customers", companyId] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
  contacts: (customerId: string) => ["customers", customerId, "contacts"] as const,
  sites: (customerId: string) => ["customers", customerId, "sites"] as const,
},
```

### Validation

- [ ] TypeScript compiles
- [ ] Keys follow same pattern as workers (array tuples)

### Files Modified

| File | Change |
|------|--------|
| `packages/api-client/src/lib/query-keys.ts` | Add `customers` group (~5 lines) |

---

## Task 3: Create Zod Schemas for Customers

**Objective:** Create Zod validation schemas for customer, contact, and site forms.
**File:** `packages/api-client/src/schemas/customer.ts` (NEW)
**Estimated Complexity:** Low
**Prerequisites:** None
**Depends On:** Nothing
**Unlocks:** Tasks 4, 7

### Implementation Steps

#### Step 3.1: Create `packages/api-client/src/schemas/customer.ts`

Follow the pattern from `schemas/worker.ts`:

```typescript
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
```

### Validation

- [ ] TypeScript compiles
- [ ] All schemas parse valid data correctly
- [ ] Schemas reject invalid data (too-short name, invalid email, etc.)

### Files Created

| File | Description |
|------|-------------|
| `packages/api-client/src/schemas/customer.ts` | Zod validation schemas for all customer forms |

---

## Task 4: Create Customer Service Layer

**Objective:** Implement `customerService` with Supabase CRUD for customers, contacts, and sites.
**File:** `packages/api-client/src/services/customer.ts` (NEW)
**Estimated Complexity:** Medium
**Prerequisites:** Tasks 1, 2, 3
**Depends On:** Types, query keys, schemas
**Unlocks:** Task 5

### Implementation Steps

#### Step 4.1: Create `packages/api-client/src/services/customer.ts`

Follow the pattern from `services/worker.ts`. The service object should have:

**Customer methods:**
- `list(companyId, filters?)` — SELECT from customers WHERE company_id = X AND deleted_at IS NULL. Filters: status, customer_type, search (name or phone ilike). Order by `created_at DESC`.
- `getById(customerId)` — SELECT customer + contacts + sites. Contacts: all for this customer. Sites: WHERE deleted_at IS NULL. Return as `CustomerWithDetails`.
- `create(companyId, payload)` — Validate with `createCustomerSchema`, INSERT into customers.
- `update(customerId, payload)` — Validate with `updateCustomerSchema`, UPDATE customers.
- `softDelete(customerId)` — UPDATE customers SET deleted_at = now().

**Contact methods:**
- `getContacts(customerId)` — SELECT from customer_contacts WHERE customer_id = X, order by is_primary DESC, created_at ASC.
- `createContact(customerId, payload)` — Validate with `createCustomerContactSchema`, INSERT into customer_contacts.
- `updateContact(contactId, payload)` — Validate with `updateCustomerContactSchema`, UPDATE customer_contacts.
- `deleteContact(contactId)` — DELETE from customer_contacts (hard delete).

**Site methods:**
- `getSites(customerId)` — SELECT from customer_sites WHERE customer_id = X AND deleted_at IS NULL, order by created_at ASC.
- `createSite(customerId, payload)` — Validate with `createCustomerSiteSchema`, INSERT into customer_sites.
- `updateSite(siteId, payload)` — Validate with `updateCustomerSiteSchema`, UPDATE customer_sites.
- `softDeleteSite(siteId)` — UPDATE customer_sites SET deleted_at = now().

**Key implementation details:**
- Import types from `@repo/types`
- Import schemas from `../schemas/customer`
- Import `getSupabase` from `../client`
- Import `mapSupabaseError, mapUnknownError, ok, fail` from `../lib/errors`
- All methods return `Promise<Result<T>>`
- All mutations validate payload with `schema.parse()` before DB call
- list() should filter `deleted_at IS NULL` explicitly (RLS also handles it, but be explicit)
- getById() makes 3 parallel queries (customer, contacts, sites) and assembles `CustomerWithDetails`
- Clean empty strings to null for optional fields before INSERT/UPDATE (phone, email, address, notes)

### Validation

- [ ] TypeScript compiles
- [ ] Service methods match the patterns in `worker.ts`
- [ ] All methods wrap errors using `fail(mapSupabaseError(error))`

### Files Created

| File | Description |
|------|-------------|
| `packages/api-client/src/services/customer.ts` | Full CRUD service for customers, contacts, sites |

---

## Task 5: Create Customer React Query Hooks

**Objective:** Create React Query hooks for all customer service methods.
**File:** `packages/api-client/src/hooks/use-customer.ts` (NEW)
**Estimated Complexity:** Medium
**Prerequisites:** Tasks 2, 4
**Depends On:** Query keys, customer service
**Unlocks:** Tasks 6, 7, 8

### Implementation Steps

#### Step 5.1: Create `packages/api-client/src/hooks/use-customer.ts`

Follow the pattern from `hooks/use-worker.ts`:

**Query Hooks (useQuery):**
- `useCustomerList(companyId, filters?)` — Calls `customerService.list()`. Enabled when `!!companyId`. Query key: `[...queryKeys.customers.all(companyId), filters]`.
- `useCustomerDetail(customerId)` — Calls `customerService.getById()`. Enabled when `!!customerId`. Query key: `queryKeys.customers.detail(customerId)`.
- `useCustomerContacts(customerId)` — Calls `customerService.getContacts()`. Enabled when `!!customerId`. Query key: `queryKeys.customers.contacts(customerId)`.
- `useCustomerSites(customerId)` — Calls `customerService.getSites()`. Enabled when `!!customerId`. Query key: `queryKeys.customers.sites(customerId)`.

**Mutation Hooks (useMutation):**
- `useCreateCustomerMutation()` — Input: `{ companyId, payload }`. Invalidates `customers.all(companyId)`.
- `useUpdateCustomerMutation()` — Input: `{ customerId, payload }`. Invalidates `customers.detail(customerId)` + `["customers"]` (all lists).
- `useSoftDeleteCustomerMutation()` — Input: `{ customerId, companyId }`. Invalidates `customers.all(companyId)`.
- `useCreateCustomerContactMutation()` — Input: `{ customerId, payload }`. Invalidates `customers.contacts(customerId)` + `customers.detail(customerId)`.
- `useUpdateCustomerContactMutation()` — Input: `{ contactId, customerId, payload }`. Invalidates `customers.contacts(customerId)` + `customers.detail(customerId)`.
- `useDeleteCustomerContactMutation()` — Input: `{ contactId, customerId }`. Invalidates `customers.contacts(customerId)` + `customers.detail(customerId)`.
- `useCreateCustomerSiteMutation()` — Input: `{ customerId, payload }`. Invalidates `customers.sites(customerId)` + `customers.detail(customerId)`.
- `useUpdateCustomerSiteMutation()` — Input: `{ siteId, customerId, payload }`. Invalidates `customers.sites(customerId)` + `customers.detail(customerId)`.
- `useSoftDeleteCustomerSiteMutation()` — Input: `{ siteId, customerId }`. Invalidates `customers.sites(customerId)` + `customers.detail(customerId)`.

### Validation

- [ ] TypeScript compiles
- [ ] Hook patterns match `use-worker.ts`
- [ ] All mutations invalidate the correct cache keys

### Files Created

| File | Description |
|------|-------------|
| `packages/api-client/src/hooks/use-customer.ts` | All React Query hooks for customers module |

---

## Task 6: Update Package Exports & Error Messages

**Objective:** Export all new customer schemas, services, hooks from `@repo/api-client`. Add customer duplicate error messages.
**Files:** `packages/api-client/src/index.ts`, `packages/api-client/src/lib/errors.ts`
**Estimated Complexity:** Low
**Prerequisites:** Tasks 3, 4, 5
**Depends On:** All api-client files created
**Unlocks:** Tasks 7, 8

### Implementation Steps

#### Step 6.1: Update `packages/api-client/src/index.ts`

Add after the Workers section:

```typescript
// ---- Customers ------------------------------------------------------------
export { customerService } from "./services/customer";
export {
  useCustomerList,
  useCustomerDetail,
  useCustomerContacts,
  useCustomerSites,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useSoftDeleteCustomerMutation,
  useCreateCustomerContactMutation,
  useUpdateCustomerContactMutation,
  useDeleteCustomerContactMutation,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  useSoftDeleteCustomerSiteMutation,
} from "./hooks/use-customer";
export {
  createCustomerSchema,
  updateCustomerSchema,
  createCustomerContactSchema,
  updateCustomerContactSchema,
  createCustomerSiteSchema,
  updateCustomerSiteSchema,
} from "./schemas/customer";
export type {
  CreateCustomerFormData,
  UpdateCustomerFormData,
  CreateCustomerContactFormData,
  UpdateCustomerContactFormData,
  CreateCustomerSiteFormData,
  UpdateCustomerSiteFormData,
} from "./schemas/customer";
```

#### Step 6.2: Update error messages in `packages/api-client/src/lib/errors.ts`

Add to `mapUniqueConstraintMessage()` function, before the default return:

```typescript
// Customers module constraints
if (combined.includes("customers") && combined.includes("name"))
  return "A customer with this name already exists.";
if (combined.includes("customer_sites") && combined.includes("name"))
  return "A site with this name already exists for this customer.";
```

### Validation

- [ ] TypeScript compiles for `packages/api-client`
- [ ] All exports accessible: `import { useCustomerList, customerService, createCustomerSchema } from "@repo/api-client"`

### Files Modified

| File | Change |
|------|--------|
| `packages/api-client/src/index.ts` | Add ~35 lines of customer exports |
| `packages/api-client/src/lib/errors.ts` | Add 4 lines for customer duplicate messages |

---

## Task 7: Build Web UI — Pages & Components

**Objective:** Create all customer web pages (list, detail, form) and sub-components (card, contact form dialog, site form dialog, contacts section, sites section).
**Directory:** `apps/web/src/pages/customers/` + `apps/web/src/components/customers/`
**Estimated Complexity:** High
**Prerequisites:** Tasks 1-6
**Depends On:** All api-client exports available
**Unlocks:** Task 8

### Step 7.1: Create Customer Card Component

**File:** `apps/web/src/components/customers/customer-card.tsx` (NEW)

Follow the pattern from `components/workers/worker-card.tsx`:

- Props: `{ customer: Customer }`
- Wraps in `<Link to={/customers/${customer.id}}>` + `<Card>`
- Shows: name, type badge (colored), status badge, phone, email
- Type badge colors:
  - `individual` → `bg-blue-100 text-blue-700`
  - `company` → `bg-purple-100 text-purple-700`
  - `government` → `bg-amber-100 text-amber-700`
- Status badge: same green/gray pattern as workers

### Step 7.2: Create Customer Form Component

**File:** `apps/web/src/components/customers/customer-form.tsx` (NEW)

Follow the pattern from `components/workers/worker-form.tsx`:

- Props: `{ defaultValues?: Customer; onSubmit: (data: CreateCustomerFormData) => void | Promise<void>; isPending?: boolean; }`
- Uses `useForm<CreateCustomerFormData>` with `zodResolver(createCustomerSchema)`
- Fields:
  - Name (Input, required)
  - Customer Type (select: individual, company, government)
  - Status (select: active, inactive, prospect) — only show in edit mode
  - Phone (Input, optional)
  - Email (Input, optional)
  - Address (textarea/Input, optional)
  - Notes (textarea, optional)
- Submit button: "Create Customer" / "Update Customer"

### Step 7.3: Create Contact Form Dialog Component

**File:** `apps/web/src/components/customers/contact-form-dialog.tsx` (NEW)

- Props: `{ customerId: string; contact?: CustomerContact; open: boolean; onOpenChange: (open: boolean) => void; }`
- Uses shadcn `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle`
- Uses `useForm<CreateCustomerContactFormData>` with `zodResolver(createCustomerContactSchema)`
- Fields: Name (required), Phone (required), Role, Department, Email, Is Primary (checkbox/switch), Notes
- On submit: calls `useCreateCustomerContactMutation` or `useUpdateCustomerContactMutation`
- On success: close dialog (via `onOpenChange(false)`)

### Step 7.4: Create Site Form Dialog Component

**File:** `apps/web/src/components/customers/site-form-dialog.tsx` (NEW)

- Props: `{ customerId: string; site?: CustomerSite; open: boolean; onOpenChange: (open: boolean) => void; }`
- Same Dialog pattern as contact form
- Uses `useForm<CreateCustomerSiteFormData>` with `zodResolver(createCustomerSiteSchema)`
- Fields: Name (required), Address, City, GPS Coordinates, Landmarks, Notes
- On submit: calls `useCreateCustomerSiteMutation` or `useUpdateCustomerSiteMutation`

### Step 7.5: Create Contacts Section Component

**File:** `apps/web/src/components/customers/contacts-section.tsx` (NEW)

- Props: `{ customerId: string; }`
- Uses `useCustomerContacts(customerId)` to fetch contacts
- Renders a Card with:
  - Header: "Contacts" title + "Add Contact" button
  - Empty state: "No contacts added yet."
  - Contact list: each contact is a row/item showing name, role, phone, email, primary badge
  - Primary contact highlighted with a star or badge
  - Each row has Edit (pencil icon) and Delete (trash icon) action buttons
- Edit opens `ContactFormDialog` with pre-filled data
- Delete shows confirmation dialog, then calls `useDeleteCustomerContactMutation`
- State: `editingContact` (CustomerContact | null), `showAddDialog` (boolean), `deletingContactId` (string | null)

### Step 7.6: Create Sites Section Component

**File:** `apps/web/src/components/customers/sites-section.tsx` (NEW)

- Props: `{ customerId: string; }`
- Uses `useCustomerSites(customerId)` to fetch sites
- Same Card pattern as contacts section
- Each site shows: name, address, city, GPS coordinates
- Each row: Edit (opens SiteFormDialog) and Delete (soft delete with confirmation)
- Delete calls `useSoftDeleteCustomerSiteMutation`

### Step 7.7: Create Customer List Page

**File:** `apps/web/src/pages/customers/list.tsx` (NEW)

Follow pattern from `pages/workers/list.tsx`:

- Uses `useMyCompanies()` to get companyId
- Uses `useCustomerList(companyId, filters)`
- State: `search`, `typeFilter`, `statusFilter`, `viewMode` (card/table)
- Header: "Customers" title + "Add Customer" link button (to `/customers/new`)
- Filters row:
  - Search input (search by name or phone)
  - Customer type select (All / Individual / Company / Government)
  - Status filter: "Show inactive" checkbox or status select
  - View mode toggle (card/table)
- Card view: grid of `CustomerCard` components
- Table view: table with Name (link), Type, Phone, Email, Status columns
- Empty state: Users icon + "No customers yet" + CTA button
- Loading: card skeletons / table skeletons

### Step 7.8: Create Customer Detail Page

**File:** `apps/web/src/pages/customers/detail.tsx` (NEW)

Follow pattern from `pages/workers/detail.tsx`:

- Uses `useParams<{ id: string }>()` + `useCustomerDetail(id)`
- Header: Back arrow (to `/customers`) + customer name + Edit button (to `/customers/${id}/edit`) + Delete button
- Delete: confirmation dialog, calls `useSoftDeleteCustomerMutation`, navigates to `/customers` on success
- Layout: 2-column grid on lg
  - Left: Details Card (type, status, phone, email, address, notes)
  - Right: Summary Card (contacts count, sites count)
- Below: full-width `ContactsSection` component
- Below: full-width `SitesSection` component

### Step 7.9: Create Customer Form Page

**File:** `apps/web/src/pages/customers/form.tsx` (NEW)

Follow pattern from `pages/workers/form.tsx`:

- Uses `useParams<{ id: string }>()` to detect create vs edit mode
- Uses `useCustomerDetail(id)` when editing
- Uses `useCreateCustomerMutation` / `useUpdateCustomerMutation`
- Header: Back arrow + "New Customer" / "Edit Customer" title
- Body: Card wrapping `CustomerForm` component
- On create success: navigate to `/customers/${newId}`
- On edit success: navigate to `/customers/${id}`
- Shows API errors via `Alert`

### Validation

- [ ] TypeScript compiles for `apps/web`
- [ ] All pages render without runtime errors
- [ ] Forms validate inputs before submission
- [ ] Contact/Site dialogs open, submit, and close correctly
- [ ] Delete confirmations work for customers, contacts, sites

### Files Created

| File | Description |
|------|-------------|
| `apps/web/src/components/customers/customer-card.tsx` | Card component for customer list |
| `apps/web/src/components/customers/customer-form.tsx` | Reusable customer create/edit form |
| `apps/web/src/components/customers/contact-form-dialog.tsx` | Dialog for add/edit contact |
| `apps/web/src/components/customers/site-form-dialog.tsx` | Dialog for add/edit site |
| `apps/web/src/components/customers/contacts-section.tsx` | Contacts list + CRUD within detail page |
| `apps/web/src/components/customers/sites-section.tsx` | Sites list + CRUD within detail page |
| `apps/web/src/pages/customers/list.tsx` | Customer list page |
| `apps/web/src/pages/customers/detail.tsx` | Customer detail page |
| `apps/web/src/pages/customers/form.tsx` | Customer create/edit form page |

---

## Task 8: Wire Routes & Sidebar Navigation

**Objective:** Add customer routes to the router and Customers entry to the sidebar.
**Files:** `apps/web/src/App.tsx`, `apps/web/src/components/layout/sidebar.tsx`
**Estimated Complexity:** Low
**Prerequisites:** Task 7
**Depends On:** All pages created
**Unlocks:** Web complete; Tasks 9-12 (Mobile)

### Implementation Steps

#### Step 8.1: Update `apps/web/src/App.tsx` (ALREADY DONE)

Add imports at the top (after WorkersFormPage import):

```typescript
import CustomerListPage from "@/pages/customers/list";
import CustomerDetailPage from "@/pages/customers/detail";
import CustomerFormPage from "@/pages/customers/form";
```

Add routes inside the `<Route element={<SidebarLayout />}>` block, after the Workers routes:

```tsx
{/* Customers routes */}
<Route path="/customers" element={<CustomerListPage />} />
<Route path="/customers/new" element={<CustomerFormPage />} />
<Route path="/customers/:id" element={<CustomerDetailPage />} />
<Route path="/customers/:id/edit" element={<CustomerFormPage />} />
```

#### Step 8.2: Update `apps/web/src/components/layout/sidebar.tsx` (ALREADY DONE)

Add `Building2` to the Lucide import:

```typescript
import { Loader2, LogOut, Wrench, Truck, Users, HardHat, Building2, ChevronLeft, ChevronRight } from "lucide-react";
```

Add Customers entry to `navGroups` array, after the Workers entry:

```typescript
{
  label: "Customers",
  to: "/customers",
  icon: Building2,
},
```

### Validation

- [ ] Navigate to `/customers` — list page renders
- [ ] Navigate to `/customers/new` — form page renders
- [ ] Sidebar shows "Customers" item with Building2 icon
- [ ] Clicking sidebar "Customers" navigates correctly
- [ ] All 4 customer routes work (/customers, /customers/new, /customers/:id, /customers/:id/edit)

### Files Modified

| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add 3 imports + 4 Route elements |
| `apps/web/src/components/layout/sidebar.tsx` | Add Building2 import + 1 navGroup entry |

---

## Task 9: Mobile — Customer Card Component

**Objective:** Create a reusable `CustomerCard` component for the mobile customer list.
**File:** `apps/mobile/components/ui/customer-card.tsx` (NEW)
**Estimated Complexity:** Low
**Prerequisites:** Task 1 (types)
**Depends On:** Shared types available
**Unlocks:** Task 10

### Implementation Steps

#### Step 9.1: Create `apps/mobile/components/ui/customer-card.tsx`

Follow the pattern from `components/ui/card.tsx` (`WorkerCard`):

```typescript
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type CustomerCardProps = {
  customer: {
    id: string;
    name: string;
    customer_type: 'individual' | 'company' | 'government';
    status: 'active' | 'inactive' | 'prospect';
    phone: string | null;
    email: string | null;
  };
  onPress?: (id: string) => void;
};
```

**Component layout:**
- `TouchableOpacity` card (same border-radius-12, border, white bg as `WorkerCard`)
- **Card header:** Customer name (bold) + status badge (green for active, gray for inactive, blue for prospect)
- **Card body rows:**
  - Type: colored badge (`individual` → `#3b82f6`, `company` → `#a855f7`, `government` → `#f59e0b`)
  - Phone: value or "—" if null
  - Email: value or "—" if null
- Same `StyleSheet.create` pattern with `styles.card`, `styles.cardHeader`, `styles.cardBody`, `styles.row`, etc.

### Validation

- [ ] Component renders with all customer types and statuses
- [ ] Tap calls `onPress(customer.id)`

### Files Created

| File | Description |
|------|-------------|
| `apps/mobile/components/ui/customer-card.tsx` | Customer list card for mobile |

---

## Task 10: Mobile — Customer List Screen

**Objective:** Create the customer list screen with search, filter chips, and pull-to-refresh.
**File:** `apps/mobile/screens/customers/list.tsx` (NEW)
**Estimated Complexity:** Medium
**Prerequisites:** Tasks 6, 9
**Depends On:** API hooks exported, CustomerCard created
**Unlocks:** Tasks 11, 12

### Implementation Steps

#### Step 10.1: Create `apps/mobile/screens/customers/list.tsx`

Follow the pattern from `screens/workers/list.tsx`:

**Hooks:**
```typescript
import { useCustomerList, useMyCompanies } from '@repo/api-client';
import type { Customer } from '@repo/types';
```

**State:**
```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('active');
const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'company' | 'government'>('all');
const [searchQuery, setSearchQuery] = useState('');
```

**Layout (top to bottom):**
1. **Header** — `ThemedText type="title"` "Customers" + add button (`MaterialIcons "add-circle"`)
2. **Filter chips** — Horizontal `ScrollView` with `FilterChip` components:
   - Status: All, Active, Inactive, Prospect
   - Type: All, Individual, Company, Government
3. **Search** — `TextInput` with search icon, placeholder "Search customers..."
4. **Content** — `ScrollView` with `RefreshControl`
   - Empty state: `MaterialIcons "business"` + "No customers yet" + `ThemedButton "Add Customer"`
   - Customer cards: `CustomerCard` for each item, `onPress` navigates to `/(app)/customers/${id}`
5. **Loading state** — `MaterialIcons "access-time"` + "Loading customers..."

**Navigation:**
- Add button → `router.push('/(app)/customers/form' as any)`
- Card tap → `router.push(\`/(app)/customers/${id}\` as any)`

**Client-side filtering** (same pattern as workers):
```typescript
const filteredCustomers = searchQuery
  ? customers.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    )
  : customers;
```

### Validation

- [ ] List loads and displays customers
- [ ] Filter chips toggle correctly
- [ ] Search filters by name and phone
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no customers exist

### Files Created

| File | Description |
|------|-------------|
| `apps/mobile/screens/customers/list.tsx` | Customer list screen with filters and search |

---

## Task 11: Mobile — Customer Detail Screen

**Objective:** Create the customer detail screen with info card, contacts section, and sites section.
**File:** `apps/mobile/screens/customers/detail.tsx` (NEW)
**Estimated Complexity:** High
**Prerequisites:** Tasks 6, 10
**Depends On:** All API hooks exported
**Unlocks:** Task 12

### Implementation Steps

#### Step 11.1: Create `apps/mobile/screens/customers/detail.tsx`

Follow the pattern from `screens/workers/detail.tsx`:

**Hooks:**
```typescript
import {
  useCustomerDetail,
  useCustomerContacts,
  useCustomerSites,
  useSoftDeleteCustomerMutation,
  useCreateCustomerContactMutation,
  useUpdateCustomerContactMutation,
  useDeleteCustomerContactMutation,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  useSoftDeleteCustomerSiteMutation,
  useMyCompanies,
} from '@repo/api-client';
import type { Customer, CustomerContact, CustomerSite } from '@repo/types';
```

**Layout (ScrollView, top to bottom):**

1. **Header** — Back button (chevron-left) + Customer name (title) + Edit button (create icon)
   - Edit navigates to `/(app)/customers/form?id=${customerId}`

2. **Actions** — Delete button (`ThemedButton variant="destructive"`)
   - Delete: `Alert.alert("Delete Customer", "Are you sure?", [Cancel, { text: "Delete", style: "destructive", onPress }])`
   - On delete: calls `useSoftDeleteCustomerMutation`, then `router.back()`

3. **Details Card** — White card with `DetailRow` sub-component:
   - Type: colored badge (same colors as CustomerCard)
   - Status: colored badge (green/gray/blue)
   - Phone: value or "—"
   - Email: value or "—"
   - Address: value or "—"
   - Notes: value or "—"

4. **Contacts Card** — White card with header + add button:
   - Header: "Contacts (N)" + `MaterialIcons "add-circle"` toggle
   - **Add form** (collapsible, shown when `showAddContact` is true):
     - `ThemedInput` for: Name, Phone, Role, Department, Email
     - `TouchableOpacity` toggle for "Primary contact"
     - `ThemedButton "Add"` to submit
     - Calls `useCreateCustomerContactMutation`
   - **Contact list:** each contact is a row:
     - Name (bold) + primary badge (star icon if `is_primary`)
     - Role / Department (muted text)
     - Phone + Email
     - Actions: Edit (pencil icon opens inline edit), Delete (trash icon with `Alert.alert` confirmation)
     - Delete calls `useDeleteCustomerContactMutation` (hard delete)
   - **Edit mode:** When editing a contact, replace the row with inline form (same fields as add form, pre-filled). Save calls `useUpdateCustomerContactMutation`.
   - Empty state: "No contacts added" (italic, muted)

5. **Sites Card** — White card with header + add button:
   - Header: "Sites (N)" + `MaterialIcons "add-circle"` toggle
   - **Add form** (collapsible):
     - `ThemedInput` for: Name, Address, City, GPS Coordinates, Landmarks
     - `ThemedButton "Add"` to submit
     - Calls `useCreateCustomerSiteMutation`
   - **Site list:** each site is a row:
     - Name (bold)
     - Address, City (muted)
     - GPS Coordinates (mono, if present)
     - Landmarks (if present)
     - Actions: Edit (opens inline edit), Delete (soft delete with confirmation)
     - Delete calls `useSoftDeleteCustomerSiteMutation`
   - **Edit mode:** Inline form with pre-filled values.
   - Empty state: "No sites added" (italic, muted)

**State management:**
```typescript
const [showAddContact, setShowAddContact] = useState(false);
const [showAddSite, setShowAddSite] = useState(false);
const [editingContactId, setEditingContactId] = useState<string | null>(null);
const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
// Form state for new contact / new site (manual useState, same as workers pattern)
const [newContact, setNewContact] = useState({ name: '', phone: '', role: '', department: '', email: '', is_primary: false });
const [newSite, setNewSite] = useState({ name: '', address: '', city: '', gps_coordinates: '', landmarks: '' });
```

**Sub-components (defined in same file):**
- `DetailRow({ label, value })` — Same as workers detail
- `ContactItem({ contact, onEdit, onDelete })` — Single contact row
- `SiteItem({ site, onEdit, onDelete })` — Single site row

### Validation

- [ ] Detail screen loads customer data
- [ ] Add contact form works (submit + clear)
- [ ] Edit contact inline form works
- [ ] Delete contact with confirmation works (hard delete)
- [ ] Primary contact toggle works (only one primary)
- [ ] Add site form works
- [ ] Edit site inline form works
- [ ] Delete site with confirmation works (soft delete)
- [ ] Delete customer navigates back to list

### Files Created

| File | Description |
|------|-------------|
| `apps/mobile/screens/customers/detail.tsx` | Full customer detail with contacts + sites CRUD |

---

## Task 12: Mobile — Customer Form Screen & Route Wiring

**Objective:** Create customer create/edit form screen and wire all Expo Router routes + home screen.
**Files:** Multiple (NEW + MODIFIED)
**Estimated Complexity:** Medium
**Prerequisites:** Tasks 10, 11
**Depends On:** List and detail screens created
**Unlocks:** Module complete (mobile)

### Implementation Steps

#### Step 12.1: Create `apps/mobile/screens/customers/form.tsx`

Follow the pattern from `screens/workers/form.tsx` (manual state + validate, NOT React Hook Form):

**Hooks:**
```typescript
import { useCustomerDetail, useCreateCustomerMutation, useUpdateCustomerMutation, useMyCompanies } from '@repo/api-client';
import type { Customer, CreateCustomerPayload } from '@repo/types';
```

**State:**
```typescript
type FormData = {
  name: string;
  customer_type: 'individual' | 'company' | 'government';
  status: 'active' | 'inactive' | 'prospect';
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const defaultFormData: FormData = {
  name: '',
  customer_type: 'company',
  status: 'active',
  phone: '',
  email: '',
  address: '',
  notes: '',
};
```

**Layout (ScrollView):**
1. **Header** — "New Customer" / "Edit Customer" title
2. **Basic Information section:**
   - `ThemedInput` for Name (required)
   - Customer Type picker — 3 segment buttons: Individual, Company, Government (same pattern as workers category picker: `TouchableOpacity` buttons with active state)
   - Status picker — 3 segment buttons: Active, Inactive, Prospect (only show in edit mode)
   - `ThemedInput` for Phone (optional, `keyboardType="phone-pad"`)
   - `ThemedInput` for Email (optional, `keyboardType="email-address"`)
   - `ThemedInput` for Address (optional, `multiline`, `numberOfLines={3}`)
   - `ThemedInput` for Notes (optional, `multiline`, `numberOfLines={3}`)
3. **Footer** — `ThemedButton "Create Customer" / "Update Customer"` (`variant="primary"`, `fullWidth`, `size="lg"`)

**Validation (manual):**
```typescript
const validate = (): boolean => {
  const newErrors: Partial<Record<keyof FormData, string>> = {};
  if (!formData.name.trim()) newErrors.name = 'Name is required';
  if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
  if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Submit:**
```typescript
const handleSubmit = async () => {
  if (!validate() || !companyId) return;
  setIsSubmitting(true);
  try {
    const payload: CreateCustomerPayload = {
      name: formData.name,
      customer_type: formData.customer_type,
      ...(isEdit && { status: formData.status }),
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.email && { email: formData.email }),
      ...(formData.address && { address: formData.address }),
      ...(formData.notes && { notes: formData.notes }),
    };
    let result;
    if (isEdit && customerId) {
      result = await updateMutation.mutateAsync({ customerId, payload });
    } else {
      result = await createMutation.mutateAsync({ companyId, payload });
    }
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else if (result.data) {
      if (isEdit) router.back();
      else router.push(`/(app)/customers/${result.data.id}` as any);
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

**Edit mode:** When `id` is in search params, fetch customer detail via `useCustomerDetail(customerId)` and populate form via `useEffect`.

#### Step 12.2: Create Route Files in `apps/mobile/app/(app)/customers/`

Create **3 thin route wrapper files** following the workers pattern:

**`apps/mobile/app/(app)/customers/index.tsx`** (NEW):
```typescript
export { default } from '@/screens/customers/list';
```

**`apps/mobile/app/(app)/customers/[id].tsx`** (NEW):
```typescript
export { default } from '@/screens/customers/detail';
```

**`apps/mobile/app/(app)/customers/form.tsx`** (NEW):
```typescript
export { default } from '@/screens/customers/form';
```

#### Step 12.3: Register Stack Screens in `apps/mobile/app/(app)/_layout.tsx`

Add 3 new `Stack.Screen` entries after the workers screens:

```tsx
<Stack.Screen name="customers/index" options={{ title: 'Customers' }} />
<Stack.Screen name="customers/[id]" options={{ title: 'Customer Detail' }} />
<Stack.Screen name="customers/form" options={{ title: 'Customer Form' }} />
```

#### Step 12.4: Add Customers to Home Screen

Update `apps/mobile/app/(app)/home.tsx`:

Add Customers to the `sections` array:

```typescript
const sections = [
  { label: 'Equipment', route: '/(app)/equipment' as const, icon: '🔧' },
  { label: 'Suppliers', route: '/(app)/suppliers' as const, icon: '🚚' },
  { label: 'Partners', route: '/(app)/partners' as const, icon: '🤝' },
  { label: 'Workers', route: '/(app)/workers/list' as const, icon: '👷' },
  { label: 'Customers', route: '/(app)/customers' as const, icon: '🏢' },
];
```

### Validation

- [ ] Navigate to Customers from home screen
- [ ] Customer list loads and displays
- [ ] "+" button navigates to form screen
- [ ] Create customer → navigates to detail
- [ ] Edit customer → pre-fills form → save navigates back
- [ ] Detail screen shows contacts and sites sections
- [ ] All CRUD operations work on mobile
- [ ] Back navigation works throughout the flow

### Files Created

| File | Description |
|------|-------------|
| `apps/mobile/screens/customers/list.tsx` | Customer list screen (from Task 10) |
| `apps/mobile/screens/customers/detail.tsx` | Customer detail screen (from Task 11) |
| `apps/mobile/screens/customers/form.tsx` | Customer create/edit form screen |
| `apps/mobile/app/(app)/customers/index.tsx` | Route wrapper → list screen |
| `apps/mobile/app/(app)/customers/[id].tsx` | Route wrapper → detail screen |
| `apps/mobile/app/(app)/customers/form.tsx` | Route wrapper → form screen |

### Files Modified

| File | Change |
|------|--------|
| `apps/mobile/app/(app)/_layout.tsx` | Add 3 `Stack.Screen` entries |
| `apps/mobile/app/(app)/home.tsx` | Add Customers + Workers to `sections` array |

---

## Implementation Order Summary

```
Task 1: Types          ─┐
Task 2: Query Keys      ├── Can be done in parallel (no dependencies between them)
Task 3: Zod Schemas    ─┘
                         │
Task 4: Service Layer  ──── Depends on 1, 2, 3
                         │
Task 5: React Hooks    ──── Depends on 2, 4
                         │
Task 6: Exports + Errors── Depends on 3, 4, 5
                         │
         ┌───────────────┴───────────────┐
         │                               │
Task 7: Web UI Pages              Task 9: Mobile Card Component
         │                               │
Task 8: Web Routes + Sidebar      Task 10: Mobile List Screen
                                         │
                                  Task 11: Mobile Detail Screen
                                         │
                                  Task 12: Mobile Form + Routes
```

**Web and Mobile UI tasks (7-8 vs 9-12) can be done in parallel** after Task 6.

**Total new files:** 19 (12 web + 7 mobile)
**Total modified files:** 6 (4 web + 2 mobile — web routes/sidebar already done)
**Estimated total lines of new code:** ~2,500-3,000

---

## Success Criteria

### Web
- [ ] All TypeScript compiles with zero errors (`npm run lint` passes)
- [ ] Customer list page loads and displays customers
- [ ] Create customer form creates a customer and redirects to detail
- [ ] Customer detail page shows info, contacts, and sites sections
- [ ] Add/Edit/Delete contact works from detail page (dialog-based)
- [ ] Add/Edit/Delete site works from detail page (dialog-based)
- [ ] Sidebar shows "Customers" and routes work
- [ ] Soft delete on customers and sites works (sets deleted_at, hides from lists)
- [ ] Hard delete on contacts works
- [ ] Duplicate name shows user-friendly error message
- [ ] Primary contact enforcement works (only one primary per customer)

### Mobile (Expo)
- [ ] Customers card on home screen navigates to list
- [ ] Customer list screen loads with filter chips and search
- [ ] Create customer form works and navigates to detail
- [ ] Customer detail shows info card, contacts section, sites section
- [ ] Add/Edit/Delete contact works inline on detail screen
- [ ] Add/Edit/Delete site works inline on detail screen
- [ ] Delete customer shows native Alert confirmation and navigates back
- [ ] Pull-to-refresh works on list screen
- [ ] Back navigation works throughout the flow
