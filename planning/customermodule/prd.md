# Customers Module - Product Requirements Document

**Module:** 003-customers-module
**Version:** 1.0
**Date:** 2026-02-13
**Status:** Draft
**Product:** Masah (geoWorks) - Multi-Tenant Surveying Platform

---

## 1. Executive Summary

The Customers Module enables surveying companies on the Masah platform to manage their client base. A **customer** represents any entity (individual, company, or government body) that commissions surveying work. Each customer may engage the company on multiple projects over time, with work performed at specific **sites**. The module provides full CRUD for customers, their **contact people**, and their **sites**, following the same patterns established by the Workers Module.

---

## 2. Product Vision

Provide surveying companies with a centralized customer registry that tracks who they work for, who to contact at each customer organization, and where the work takes place. This module is the foundation for future project tracking, invoicing, and daily work assignment features.

---

## 3. Target Users

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Company Owner** | The surveying company admin who manages operations | Create customers, assign sites, maintain contact lists |
| **Company Member** | Staff who perform surveying work | View customer info, look up site details and contact people |

---

## 4. Problem Statement

Surveying companies need to:

1. **Track customers** - Know who they are doing work for, whether it's an individual, private company, or government entity.
2. **Manage contact people** - When a customer is an organization, multiple people may be involved (decision makers, site supervisors, billing contacts). The company needs a way to record and look up these contacts.
3. **Manage work sites** - Each customer may have one or many physical sites where surveying work is performed. Sites need addresses, GPS coordinates, and landmarks for field crews to locate them.
4. **Maintain history** - Customers may return for multiple projects over time. Having a persistent record avoids re-entering information.

---

## 5. Solution Overview

A three-entity data model:

```
Customer (1) ──── (N) Customer Contacts
    │
    └──── (N) Customer Sites
```

- **Customer** - The top-level entity. Created with a name and optional details. Supports soft-delete.
- **Customer Contacts** - People associated with a customer. One can be marked as the primary contact. Hard-deleted when removed (or cascade-deleted with the customer).
- **Customer Sites** - Physical locations where work is performed. Supports soft-delete.

### User Flow

1. **Create Customer** - Owner navigates to Customers > New. Fills in name (required), type, phone, email, address, notes. Saves.
2. **View Customer** - From the list, tap/click a customer to see the detail page showing customer info, contacts section, and sites section.
3. **Add Contact** - On the customer detail page, add a contact person with name (required), phone (required), role, department, email, notes. Optionally mark as primary.
4. **Add Site** - On the customer detail page, add a site with name (required), address, city, GPS coordinates, landmarks, notes.
5. **Edit/Delete** - All entities can be edited. Customers and sites are soft-deleted. Contacts are hard-deleted.

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Customer creation completion rate | > 90% | % of users who start and finish creating a customer |
| Contact lookup time | < 5 seconds | Time from opening customer detail to finding a contact |
| Module adoption | 80% of active companies have >= 1 customer within 30 days | Database query |

---

## 7. Feature Requirements

### F1: Customer Management (Priority: P0)

#### F1.1: Customer List Page

| Attribute | Detail |
|-----------|--------|
| **Description** | Display all active customers for the company in a card/list layout |
| **User Benefit** | Quick overview of all customers with search and filter capabilities |
| **Acceptance Criteria** | - Shows customer name, type, status, phone, email |
| | - Search by name or phone |
| | - Filter by status (active, inactive, prospect) and type (individual, company, government) |
| | - Empty state with CTA to add first customer |
| | - Loading skeleton while fetching |
| | - "New Customer" button navigates to creation form |

#### F1.2: Create/Edit Customer Form

| Attribute | Detail |
|-----------|--------|
| **Description** | Form to create a new customer or edit an existing one |
| **User Benefit** | Quick customer registration with minimal required fields |
| **Fields** | - **Name** (required, 2-200 chars) |
| | - **Type** (dropdown: individual, company, government; default: company) |
| | - **Status** (dropdown: active, inactive, prospect; default: active) |
| | - **Phone** (optional, max 20 chars, validated format) |
| | - **Email** (optional, max 100 chars, validated format) |
| | - **Address** (optional, max 500 chars) |
| | - **Notes** (optional, free text) |
| **Acceptance Criteria** | - Form validates on submit (Zod + React Hook Form) |
| | - Duplicate name within same company shows error |
| | - Success redirects to customer detail page |
| | - Cancel returns to previous page |

#### F1.3: Customer Detail Page

| Attribute | Detail |
|-----------|--------|
| **Description** | Full view of a customer with tabs/sections for contacts and sites |
| **User Benefit** | Single page to see everything about a customer |
| **Sections** | 1. **Header** - Customer name, type badge, status badge, edit button, delete button |
| | 2. **Info** - Phone, email, address, notes |
| | 3. **Contacts** - List of contact people with inline add/edit/delete |
| | 4. **Sites** - List of sites with inline add/edit/delete |
| **Acceptance Criteria** | - Displays all customer fields |
| | - Edit navigates to form page |
| | - Delete soft-deletes with confirmation dialog |
| | - Contacts and sites sections load independently |

---

### F2: Customer Contacts (Priority: P0)

#### F2.1: Contact List (within Customer Detail)

| Attribute | Detail |
|-----------|--------|
| **Description** | Display all contacts for a customer within the detail page |
| **User Benefit** | Quickly find who to call at a customer organization |
| **Acceptance Criteria** | - Shows name, role, department, phone, email, primary badge |
| | - Primary contact shown first / highlighted |
| | - "Add Contact" button opens form dialog |
| | - Each contact has edit and delete actions |

#### F2.2: Add/Edit Contact

| Attribute | Detail |
|-----------|--------|
| **Description** | Dialog/inline form to add or edit a customer contact |
| **Fields** | - **Name** (required, 2-100 chars) |
| | - **Phone** (required, max 20 chars, validated) |
| | - **Role** (optional, max 100 chars) - e.g., "Site Supervisor", "Project Manager" |
| | - **Department** (optional, max 100 chars) |
| | - **Email** (optional, max 100 chars, validated) |
| | - **Is Primary** (toggle, default false) |
| | - **Notes** (optional) |
| **Acceptance Criteria** | - Setting a contact as primary automatically unsets the previous primary (handled by DB trigger) |
| | - Form validates before submission |
| | - Success refreshes the contacts list |

#### F2.3: Delete Contact

| Attribute | Detail |
|-----------|--------|
| **Description** | Remove a contact person from a customer |
| **Acceptance Criteria** | - Confirmation dialog before deletion |
| | - Hard delete (not soft delete) |
| | - Refreshes contacts list on success |

---

### F3: Customer Sites (Priority: P0)

#### F3.1: Sites List (within Customer Detail)

| Attribute | Detail |
|-----------|--------|
| **Description** | Display all active sites for a customer within the detail page |
| **User Benefit** | View all locations where work is performed for this customer |
| **Acceptance Criteria** | - Shows site name, address, city, GPS coordinates |
| | - "Add Site" button opens form dialog |
| | - Each site has edit and delete actions |

#### F3.2: Add/Edit Site

| Attribute | Detail |
|-----------|--------|
| **Description** | Dialog/inline form to add or edit a customer site |
| **Fields** | - **Name** (required, 2-200 chars) |
| | - **Address** (optional, max 500 chars) |
| | - **City** (optional, max 100 chars) |
| | - **GPS Coordinates** (optional, max 50 chars, format: "lat,lng") |
| | - **Landmarks** (optional, max 200 chars) - nearby landmarks to help locate the site |
| | - **Notes** (optional) |
| **Acceptance Criteria** | - Duplicate site name within same customer shows error |
| | - GPS coordinates validated for lat,lng format |
| | - Success refreshes the sites list |

#### F3.3: Delete Site

| Attribute | Detail |
|-----------|--------|
| **Description** | Remove a site from a customer |
| **Acceptance Criteria** | - Confirmation dialog before deletion |
| | - Soft delete (sets `deleted_at`) |
| | - Refreshes sites list on success |

---

### F4: Navigation & Sidebar (Priority: P0)

| Attribute | Detail |
|-----------|--------|
| **Description** | Add Customers entry to the sidebar navigation |
| **Acceptance Criteria** | - "Customers" item in sidebar under the appropriate nav group |
| | - Icon: `Users` or `Building2` from Lucide |
| | - Routes: `/customers`, `/customers/new`, `/customers/:id`, `/customers/:id/edit` |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Customer list loads in < 1s for up to 500 customers |
| **Security** | Row-Level Security (RLS) ensures tenants only see their own data. All queries scoped by `company_id`. |
| **Multi-tenancy** | Every customer, contact, and site belongs to a company via `company_id` (direct or through customer FK) |
| **Soft Delete** | Customers and sites use `deleted_at` for soft delete. Contacts are hard-deleted. |
| **Validation** | Client-side (Zod) and server-side (DB constraints) validation on all inputs |
| **Responsive** | Web UI works on desktop and tablet breakpoints |

---

## 9. Database Schema (Already Staged)

The database migrations are already prepared and staged:

- `supabase/migrations/20250213000001_customers_schema.sql` - Tables, enums, constraints, triggers
- `supabase/migrations/20250213000002_customers_rls.sql` - RLS policies

### Enums

```sql
customer_type: 'individual' | 'company' | 'government'
customer_status: 'active' | 'inactive' | 'prospect'
```

### Tables

| Table | Key Fields | Delete Strategy |
|-------|-----------|-----------------|
| `customers` | id, company_id, name, customer_type, status, phone, email, address, notes | Soft delete |
| `customer_contacts` | id, customer_id, name, role, department, phone, email, is_primary, notes | Hard delete |
| `customer_sites` | id, customer_id, name, address, city, gps_coordinates, landmarks, notes | Soft delete |

### RLS Summary

- All policies scoped via `get_my_company_ids()` helper
- All authenticated company members can SELECT, INSERT, UPDATE, DELETE
- SELECT policies exclude soft-deleted records (`deleted_at IS NULL`)
- Helper functions: `is_my_customer()`, `is_my_customer_contact()`, `is_my_customer_site()`

---

## 10. Technical Implementation Plan

### Packages to Update

| Package | Files to Create/Update |
|---------|----------------------|
| `packages/types` | Add Customer, CustomerContact, CustomerSite types + payloads to `index.ts` |
| `packages/api-client` | `schemas/customer.ts` - Zod validation schemas |
| | `services/customer.ts` - Supabase service layer |
| | `hooks/use-customer.ts` - React Query hooks |
| | `lib/query-keys.ts` - Add customers query keys |
| | `index.ts` - Export new modules |

### Web App Pages & Components

| File | Description |
|------|-------------|
| `apps/web/src/pages/customers/list.tsx` | Customer list with search, filters |
| `apps/web/src/pages/customers/detail.tsx` | Customer detail with contacts + sites sections |
| `apps/web/src/pages/customers/form.tsx` | Create/edit customer form |
| `apps/web/src/components/customers/customer-card.tsx` | Card component for the list |
| `apps/web/src/components/customers/contact-form-dialog.tsx` | Dialog for add/edit contact |
| `apps/web/src/components/customers/site-form-dialog.tsx` | Dialog for add/edit site |
| `apps/web/src/components/customers/contacts-section.tsx` | Contacts list + CRUD in detail page |
| `apps/web/src/components/customers/sites-section.tsx` | Sites list + CRUD in detail page |
| `apps/web/src/App.tsx` | Add customer routes |
| `apps/web/src/components/layout/sidebar.tsx` | Add Customers nav item |

### Pattern References

Follow the Workers Module patterns established in:
- `packages/api-client/src/services/worker.ts` - Service pattern
- `packages/api-client/src/hooks/use-worker.ts` - Hook pattern
- `packages/api-client/src/schemas/worker.ts` - Zod schema pattern
- `apps/web/src/pages/workers/` - Page pattern
- `apps/web/src/components/workers/` - Component pattern

---

## 11. Constraints and Dependencies

| Type | Detail |
|------|--------|
| **Dependency** | Core schema must be deployed (companies, profiles, company_members, RLS helpers) |
| **Dependency** | Auth module must be functional (login/signup, session management) |
| **Constraint** | Must use existing tech stack: React 19, React Router v7, shadcn/ui, TanStack Query v5, Zod, Supabase JS v2 |
| **Constraint** | All shared types in `@repo/types`, all API calls in `@repo/api-client` |
| **Constraint** | TypeScript strict mode, arrow functions, absolute paths |
| **Future Integration** | Projects module will reference `customers.id` and `customer_sites.id` |
| **Future Integration** | Daily Work module will link to customer sites |

---

## 12. Release Plan

### Phase 1: Core CRUD (This Release)

1. Apply database migrations (already staged)
2. Add shared types to `@repo/types`
3. Implement Zod schemas, service layer, React Query hooks in `@repo/api-client`
4. Build web pages: list, detail, form
5. Build web components: customer card, contact form dialog, site form dialog, contacts section, sites section
6. Add routes and sidebar navigation

### Phase 2: Enhancements (Future)

- Mobile (Expo) customer screens
- Customer search across sites and contacts
- Map view for customer sites
- Customer activity history / timeline
- Link customers to projects and daily work

---

## 13. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should there be a QuickAdd component for customers (like workers)? | Open |
| 2 | Should sites support a map picker for GPS coordinates? | Deferred to Phase 2 |
| 3 | Should contacts support multiple phone numbers? | Open |
| 4 | Should the customer detail page use tabs or scrollable sections for contacts/sites? | Open - recommend sections for simplicity |

---

## 14. Appendices

### A. User Flow Diagram

```
Sidebar: Customers
       │
       v
 Customer List Page
  ├── [Search / Filter]
  ├── [+ New Customer] ──> Customer Form Page (Create)
  └── [Click Customer] ──> Customer Detail Page
                              ├── Customer Info Section
                              │    └── [Edit] ──> Customer Form Page (Edit)
                              │    └── [Delete] ──> Confirmation Dialog ──> Soft Delete
                              ├── Contacts Section
                              │    ├── [+ Add Contact] ──> Contact Dialog (Create)
                              │    ├── [Edit Contact] ──> Contact Dialog (Edit)
                              │    └── [Delete Contact] ──> Confirmation ──> Hard Delete
                              └── Sites Section
                                   ├── [+ Add Site] ──> Site Dialog (Create)
                                   ├── [Edit Site] ──> Site Dialog (Edit)
                                   └── [Delete Site] ──> Confirmation ──> Soft Delete
```

### B. Entity Relationship

```
companies (tenant)
    │
    └── customers (company_id FK)
            ├── customer_contacts (customer_id FK)
            └── customer_sites (customer_id FK)
```
