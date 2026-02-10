# Quickstart: Equipment Module

**Feature**: 001-equipment-module
**Date**: 2026-02-11

## Prerequisites

- Node.js >= 18
- Supabase CLI installed (`npx supabase`)
- Local Supabase instance running (`npx supabase start`)
- Existing schema applied (migrations 01–04)

## Phase 1: DB Migrations (expert.db agent)

### What to build

3 new migration files in `supabase/migrations/`:

1. **`20250211000001_equipment_schema.sql`** — Create enums, tables, indexes, constraints, triggers
   - Enums: `ownership_type`, `equipment_status`
   - Tables: `equipment_types`, `suppliers`, `partners`, `equipment`, `equipment_partners`
   - Trigger function: `check_equipment_partner_total()`
   - Reuse existing: `set_updated_at()` trigger function

2. **`20250211000002_equipment_rls.sql`** — Enable RLS + create policies
   - Reuse existing helpers: `get_my_company_ids()`, `has_company_role()`
   - 5 tables × appropriate SELECT/INSERT/UPDATE/DELETE policies

3. **`20250211000003_equipment_seed.sql`** — Seed default equipment types
   - Insert system types with `company_id = NULL`

### Key references

- Data model: [data-model.md](data-model.md)
- Existing migration patterns: `supabase/migrations/20250209000001_init_schema.sql`
- Existing RLS patterns: `supabase/migrations/20250209000002_rls_policies.sql`

### Verification

```bash
npx supabase db reset   # Apply all migrations fresh
npx supabase db lint     # Check for issues
```

---

## Phase 2: Backend / API Client (expert.BE agent)

### What to build

Extend `packages/types/` and `packages/api-client/` with equipment module types, services, hooks, and schemas.

**New files**:
- `packages/api-client/src/services/equipment.ts` — CRUD + partner ownership + types
- `packages/api-client/src/services/supplier.ts` — CRUD
- `packages/api-client/src/services/partner.ts` — CRUD
- `packages/api-client/src/hooks/use-equipment.ts` — React Query hooks
- `packages/api-client/src/hooks/use-supplier.ts` — React Query hooks
- `packages/api-client/src/hooks/use-partner.ts` — React Query hooks
- `packages/api-client/src/schemas/equipment.ts` — Zod schemas
- `packages/api-client/src/schemas/supplier.ts` — Zod schemas
- `packages/api-client/src/schemas/partner.ts` — Zod schemas

**Files to update**:
- `packages/types/src/index.ts` — Add all new types from `contracts/types.ts`
- `packages/api-client/src/lib/query-keys.ts` — Add equipment, suppliers, partners keys
- `packages/api-client/src/index.ts` — Export all new services, hooks, schemas

### Key references

- Type contracts: [contracts/types.ts](contracts/types.ts)
- Service contracts: [contracts/equipment.ts](contracts/equipment.ts), [contracts/suppliers.ts](contracts/suppliers.ts), [contracts/partners.ts](contracts/partners.ts)
- Existing service pattern: `packages/api-client/src/services/company.ts`
- Existing hook pattern: `packages/api-client/src/hooks/use-company.ts`
- Existing schema pattern: `packages/api-client/src/schemas/company.ts`

### Verification

```bash
npm run check-types    # TypeScript type check across monorepo
npm run build          # Build all packages
```

---

## Phase 3: Frontend Web (expert.FE_WEB agent)

### What to build

Add sidebar navigation layout and equipment/supplier/partner pages to `apps/web/`.

**Layout**:
- `src/components/layout/sidebar.tsx` — Persistent left sidebar with nav items
- Update `src/App.tsx` — Add new routes, wrap authenticated pages with sidebar layout

**Pages** (for each entity: equipment, suppliers, partners):
- `list.tsx` — Table/card toggle, filters, search, pagination
- `detail.tsx` — Full view with linked data (partners for equipment, equipment for supplier/partner)
- `form.tsx` — Add/edit with React Hook Form + Zod validation

**Components**:
- `src/components/equipment/equipment-form.tsx` — Form with conditional fields for rented/owned
- `src/components/equipment/equipment-card.tsx` — Card view item
- `src/components/equipment/partner-ownership.tsx` — Add/remove partners with percentage
- `src/components/supplier/supplier-form.tsx`, `supplier-card.tsx`
- `src/components/partner/partner-form.tsx`, `partner-card.tsx`

### Key references

- Existing UI components: `apps/web/src/components/ui/`
- Existing page pattern: `apps/web/src/pages/home.tsx`
- Hooks from Phase 2: `@repo/api-client` exports

### Verification

```bash
cd apps/web && npm run dev    # Start dev server, verify navigation and pages
npm run build                  # Ensure production build works
```

---

## Phase 4: Frontend Mobile (expert.FE_EXPO agent)

### What to build

Add equipment/supplier/partner screens to `apps/mobile/` using Expo Router.

**Navigation**:
- Update `app/(tabs)/_layout.tsx` — Add bottom tabs or drawer items for Equipment, Suppliers, Partners

**Screens** (for each entity):
- `app/(app)/equipment/index.tsx` — List with card/table toggle
- `app/(app)/equipment/[id].tsx` — Detail view
- `app/(app)/equipment/form.tsx` — Add/edit
- Same pattern for suppliers and partners

### Key references

- Existing mobile structure: `apps/mobile/app/(tabs)/`, `apps/mobile/app/(auth)/`
- Hooks from Phase 2: `@repo/api-client` exports (same as web)
- Expo Router docs for file-based routing

### Verification

```bash
cd apps/mobile && npm start    # Start Expo dev server
# Test on iOS simulator / Android emulator / Expo Go
```

---

## Phase Dependencies

```
Phase 1: DB Migrations
    ↓ (must complete first)
Phase 2: Backend / API Client
    ↓ (must complete first)
Phase 3: Frontend Web  ←→  Phase 4: Frontend Mobile
    (can run in parallel — both depend only on Phase 2)
```
