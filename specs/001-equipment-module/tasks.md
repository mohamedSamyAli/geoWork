# Tasks: Equipment Module

**Input**: Design documents from `/specs/001-equipment-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks generated (testing not configured per plan.md).

**Organization**: Tasks are organized by user story (US1–US6) for independent implementation. DB migrations and backend API client are foundational phases that must complete before any user story frontend work begins. Within each user story, web and mobile tasks can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US6) this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **DB migrations**: `supabase/migrations/`
- **Shared types**: `packages/types/src/`
- **API client**: `packages/api-client/src/`
- **Web app**: `apps/web/src/`
- **Mobile app**: `apps/mobile/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared TypeScript types used by all subsequent phases

**Agent**: expert.BE

- [ ] T001 Add equipment module types (OwnershipType, EquipmentStatus enums; EquipmentType, Supplier, Partner, Equipment, EquipmentPartner interfaces; all DTO/payload types; composite types EquipmentWithType, EquipmentWithDetails, EquipmentPartnerWithDetails, SupplierWithEquipmentCount, PartnerWithEquipmentCount, LinkedEquipment, CreateEquipmentTypePayload) to packages/types/src/index.ts per contracts/types.ts

---

## Phase 2: DB Migrations (Foundational)

**Purpose**: Create all database tables, enums, indexes, constraints, triggers, RLS policies, and seed data

**⚠️ CRITICAL**: No backend or frontend work can begin until this phase is complete

**Agent**: expert.db

- [ ] T002 Create schema migration with enums (ownership_type, equipment_status), tables (equipment_types, suppliers, partners, equipment, equipment_partners), all indexes (idx_suppliers_company_id, idx_partners_company_id, idx_equipment_company_id, idx_equipment_supplier_id, idx_equipment_type_id, idx_equipment_status, idx_equipment_partners_equipment_id, idx_equipment_partners_partner_id), check constraints (rented requires supplier+costs, owned requires nulls), unique constraints, updated_at triggers reusing set_updated_at(), and trigger function check_equipment_partner_total() in supabase/migrations/20250211000001_equipment_schema.sql per data-model.md
- [ ] T003 Create RLS policies migration enabling row-level security on all 5 new tables with SELECT/INSERT/UPDATE/DELETE policies using existing get_my_company_ids() and has_company_role() helpers — equipment_types (system+company visible, owner insert/delete custom), suppliers (member select, owner CUD), partners (member select, owner CUD), equipment (member select, owner insert/update, no delete), equipment_partners (member select via equipment subquery, owner CUD via equipment subquery) in supabase/migrations/20250211000002_equipment_rls.sql per data-model.md RLS section
- [ ] T004 Create seed data migration inserting default equipment types with company_id = NULL: Total Station, GPS / GNSS, Level, Theodolite, Drone / UAV, 3D Scanner, Echo Sounder, Other in supabase/migrations/20250211000003_equipment_seed.sql

**Checkpoint**: Run `npx supabase db reset && npx supabase db lint` to verify all migrations apply cleanly

---

## Phase 3: Backend API Client (Foundational)

**Purpose**: Implement all services, React Query hooks, Zod schemas, and query keys in @repo/api-client

**⚠️ CRITICAL**: No frontend (web or mobile) work can begin until this phase is complete

**Agent**: expert.BE

- [ ] T005 Add query key factories for equipment (all, detail, partners, types), suppliers (all, detail), and partners (all, detail) to packages/api-client/src/lib/query-keys.ts per query key sections in contracts/equipment.ts, contracts/suppliers.ts, contracts/partners.ts
- [ ] T006 [P] Create equipment Zod validation schemas (createEquipmentSchema with conditional rental field requirements based on ownership_type, updateEquipmentSchema, createEquipmentTypeSchema) with form-ready types inferred via z.infer in packages/api-client/src/schemas/equipment.ts
- [ ] T007 [P] Create supplier Zod validation schemas (createSupplierSchema with name required + non-empty check, updateSupplierSchema) with form-ready types in packages/api-client/src/schemas/supplier.ts
- [ ] T008 [P] Create partner Zod validation schemas (createPartnerSchema with name required + non-empty check, updatePartnerSchema) with form-ready types in packages/api-client/src/schemas/partner.ts
- [ ] T009 [P] Implement equipmentService with list(companyId, filters?), getById(equipmentId), create(companyId, payload), update(equipmentId, payload), archive(equipmentId), reactivate(equipmentId), listPartners(equipmentId), addPartner(equipmentId, payload), updatePartnerPercentage(equipmentPartnerId, payload), removePartner(equipmentPartnerId), listTypes(companyId), createType(companyId, payload), deleteType(typeId) in packages/api-client/src/services/equipment.ts per contracts/equipment.ts
- [ ] T010 [P] Implement supplierService with list(companyId, filters?), getById(supplierId) returning linked equipment, create(companyId, payload), update(supplierId, payload), delete(supplierId) in packages/api-client/src/services/supplier.ts per contracts/suppliers.ts
- [ ] T011 [P] Implement partnerService with list(companyId, filters?), getById(partnerId) returning linked equipment with percentages, create(companyId, payload), update(partnerId, payload), delete(partnerId) in packages/api-client/src/services/partner.ts per contracts/partners.ts
- [ ] T012 [P] Create React Query hooks (useEquipmentList, useEquipmentDetail, useCreateEquipment, useUpdateEquipment, useArchiveEquipment, useReactivateEquipment, useEquipmentPartners, useAddEquipmentPartner, useUpdateEquipmentPartner, useRemoveEquipmentPartner, useEquipmentTypes, useCreateEquipmentType) with proper query key invalidation in packages/api-client/src/hooks/use-equipment.ts
- [ ] T013 [P] Create React Query hooks (useSupplierList, useSupplierDetail, useCreateSupplier, useUpdateSupplier, useDeleteSupplier) with proper query key invalidation in packages/api-client/src/hooks/use-supplier.ts
- [ ] T014 [P] Create React Query hooks (usePartnerList, usePartnerDetail, useCreatePartner, useUpdatePartner, useDeletePartner) with proper query key invalidation in packages/api-client/src/hooks/use-partner.ts
- [ ] T015 Export all new services (equipmentService, supplierService, partnerService), hooks (use-equipment, use-supplier, use-partner), and schemas (equipment, supplier, partner) from packages/api-client/src/index.ts

**Checkpoint**: Run `npm run check-types && npm run build` to verify all packages compile

---

## Phase 4: User Story 1 — Manage Equipment Records (Priority: P1) 🎯 MVP

**Goal**: Owner can create, edit, view, and list equipment records with all fields (name, serial number, type, model, ownership type) including conditional rental fields for rented equipment. Sidebar navigation provides access to Equipment, Suppliers, and Partners sections.

**Independent Test**: Create an "owned" equipment record → verify it appears in list → edit its serial number → verify change on detail page → create a "rented" equipment record with supplier and costs → verify all data displays correctly → confirm no cross-company data visible

### Web Implementation

- [ ] T016 [P] [US1] Create sidebar layout component with navigation items for Equipment, Suppliers, Partners using React Router NavLink with active states in apps/web/src/components/layout/sidebar.tsx
- [ ] T017 [US1] Update App.tsx to add routes for /equipment, /equipment/:id, /equipment/new, /equipment/:id/edit, /suppliers/*, /partners/* and wrap authenticated routes with sidebar layout in apps/web/src/App.tsx
- [ ] T018 [P] [US1] Create equipment card component displaying equipment name, serial number, type name, model, ownership type badge, and status badge with link to detail page in apps/web/src/components/equipment/equipment-card.tsx
- [ ] T019 [P] [US1] Create equipment form component with React Hook Form + Zod (createEquipmentSchema): fields for name, serial_number, equipment_type_id (dropdown from useEquipmentTypes), model, ownership_type (radio owned/rented), and conditional fields when rented (supplier_id select from useSupplierList, monthly_rent, daily_rent numeric inputs) in apps/web/src/components/equipment/equipment-form.tsx
- [ ] T020 [US1] Create equipment list page fetching data via useEquipmentList, rendering equipment-card components in a grid, with "Add Equipment" button linking to /equipment/new in apps/web/src/pages/equipment/list.tsx
- [ ] T021 [US1] Create equipment detail page fetching data via useEquipmentDetail, displaying all equipment fields, equipment type name, status with archive/reactivate button, and supplier info with rental costs (if rented) in apps/web/src/pages/equipment/detail.tsx
- [ ] T022 [US1] Create equipment add/edit page: uses equipment-form component, calls useCreateEquipment for new or useUpdateEquipment for existing (prefilled via useEquipmentDetail), navigates to detail on success in apps/web/src/pages/equipment/form.tsx

### Mobile Implementation

- [ ] T023 [P] [US1] Update tab/drawer navigation to include Equipment, Suppliers, Partners navigation entries with appropriate icons in apps/mobile/app/(tabs)/_layout.tsx
- [ ] T024 [P] [US1] Create equipment list screen with FlatList rendering equipment items (name, serial, type, status), pull-to-refresh, and FAB/header button to add new equipment in apps/mobile/app/(app)/equipment/index.tsx
- [ ] T025 [P] [US1] Create equipment detail screen displaying all equipment fields, type name, status with archive/reactivate action, supplier info with rental costs (if rented), and edit button in apps/mobile/app/(app)/equipment/[id].tsx
- [ ] T026 [P] [US1] Create equipment add/edit screen with ScrollView form: name, serial_number, equipment_type_id (picker), model, ownership_type (segmented control), conditional rental fields (supplier picker, monthly_rent, daily_rent), submit with create/update mutation in apps/mobile/app/(app)/equipment/form.tsx

**Checkpoint**: Equipment CRUD fully functional on both web and mobile — create owned + rented equipment, edit, view detail, list all. Sidebar navigation shows all three sections.

---

## Phase 5: User Story 2 — Rented Equipment with Supplier Linking (Priority: P2)

**Goal**: Rented equipment prominently displays supplier name and rental costs; ownership type transitions (owned↔rented) show confirmation warnings about data loss; empty supplier state is handled gracefully

**Independent Test**: Create a supplier → create rented equipment linked to that supplier → verify supplier name, monthly rent, and daily rent are prominent on equipment detail → change equipment from rented to owned → verify warning about losing supplier data

**Depends on**: US1 (equipment pages must exist)

**Note**: Full supplier CRUD pages are built in US4 (Phase 7). This phase focuses on the equipment-side rental experience.

### Web Implementation

- [ ] T027 [P] [US2] Enhance equipment detail page to add a prominent "Rental Information" section for rented equipment showing supplier name (linked to supplier detail), monthly rent, and daily rent formatted as currency; hide this section for owned equipment in apps/web/src/pages/equipment/detail.tsx
- [ ] T028 [P] [US2] Add ownership type transition confirmation dialogs to equipment form: when changing owned→rented warn "Partner ownership data will be removed", when changing rented→owned warn "Supplier and rental cost data will be removed", require explicit confirmation before proceeding in apps/web/src/components/equipment/equipment-form.tsx

### Mobile Implementation

- [ ] T029 [P] [US2] Enhance equipment detail screen to add a "Rental Information" card for rented equipment showing supplier name, monthly rent, and daily rent in apps/mobile/app/(app)/equipment/[id].tsx
- [ ] T030 [P] [US2] Add ownership type transition confirmation alerts (Alert.alert) to mobile equipment form when changing between owned and rented in apps/mobile/app/(app)/equipment/form.tsx

**Checkpoint**: Rented equipment shows prominent supplier + costs on detail; ownership type changes trigger data-loss confirmation warnings

---

## Phase 6: User Story 3 — Owned Equipment with Partner Ownership (Priority: P3)

**Goal**: Owned equipment detail page shows partner ownership breakdown with ability to add/remove/edit partner percentages; company's share auto-calculated as 100% minus total partner percentages; percentage validation enforced (1–99%, total ≤ 100%)

**Independent Test**: Create owned equipment → verify "Company owns 100%" → add partner with 20% → verify "Partner: 20%, Company: 80%" → try adding partner that would exceed 100% → verify rejection → remove partner → verify company returns to 100%

**Depends on**: US1 (equipment detail page must exist)

**Note**: Full partner CRUD pages are built in US5 (Phase 8). This phase focuses on the ownership management section within equipment detail.

### Web Implementation

- [ ] T031 [P] [US3] Create partner ownership component: displays list of partners with name and percentage, company's auto-calculated share, "Add Partner" button with partner select dropdown (from usePartnerList) and percentage input, inline edit percentage, remove partner button; uses useEquipmentPartners, useAddEquipmentPartner, useUpdateEquipmentPartner, useRemoveEquipmentPartner hooks; validates total ≤ 100% client-side; hidden for rented equipment in apps/web/src/components/equipment/partner-ownership.tsx
- [ ] T032 [US3] Integrate partner-ownership component into equipment detail page: render below equipment info section, only visible when ownership_type is "owned" in apps/web/src/pages/equipment/detail.tsx

### Mobile Implementation

- [ ] T033 [US3] Add partner ownership section to mobile equipment detail screen: displays partner list with percentages, company share, add/remove/edit partner functionality using bottom sheet or modal, percentage validation, only visible for owned equipment in apps/mobile/app/(app)/equipment/[id].tsx

**Checkpoint**: Owned equipment shows full ownership breakdown; partners can be added/removed/edited with percentage validation; rented equipment hides partner section

---

## Phase 7: User Story 4 — Manage Suppliers (Priority: P4)

**Goal**: Owner can create, edit, view, and list suppliers with name and phone; supplier detail shows all rented equipment linked to that supplier with equipment name and rental costs; duplicate supplier names rejected

**Independent Test**: Create a supplier → verify it appears in list → edit phone → verify on detail page → view linked equipment list (from rented equipment created in US1/US2) → try creating duplicate name → verify rejection

### Web Implementation

- [ ] T034 [P] [US4] Create supplier card component displaying supplier name, phone, and rented equipment count badge in apps/web/src/components/supplier/supplier-card.tsx
- [ ] T035 [P] [US4] Create supplier form component with React Hook Form + Zod (createSupplierSchema): name (required, non-empty) and phone fields in apps/web/src/components/supplier/supplier-form.tsx
- [ ] T036 [US4] Create supplier list page fetching data via useSupplierList, rendering supplier-card components in a grid, with "Add Supplier" button in apps/web/src/pages/suppliers/list.tsx
- [ ] T037 [US4] Create supplier detail page fetching data via useSupplierDetail, displaying supplier name and phone, and a "Rented Equipment" section listing all linked equipment (name, serial number, monthly rent, daily rent) in apps/web/src/pages/suppliers/detail.tsx
- [ ] T038 [US4] Create supplier add/edit page using supplier-form component with create/update mutations, navigates to detail on success in apps/web/src/pages/suppliers/form.tsx

### Mobile Implementation

- [ ] T039 [P] [US4] Create supplier list screen with FlatList rendering supplier items (name, phone, equipment count), pull-to-refresh, and add button in apps/mobile/app/(app)/suppliers/index.tsx
- [ ] T040 [P] [US4] Create supplier detail screen displaying name, phone, and linked rented equipment list with rental costs in apps/mobile/app/(app)/suppliers/[id].tsx
- [ ] T041 [P] [US4] Create supplier add/edit screen with form fields (name, phone) and create/update mutation in apps/mobile/app/(app)/suppliers/form.tsx

**Checkpoint**: Supplier CRUD fully functional on web + mobile; supplier detail shows linked rented equipment with costs

---

## Phase 8: User Story 5 — Manage Partners (Priority: P5)

**Goal**: Owner can create, edit, view, and list partners with name and phone; partner detail shows all co-owned equipment with equipment name and ownership percentage; duplicate partner names rejected

**Independent Test**: Create a partner → verify it appears in list → edit phone → verify on detail page → view linked equipment list with percentages (from partner assignments in US3) → try creating duplicate name → verify rejection

### Web Implementation

- [ ] T042 [P] [US5] Create partner card component displaying partner name, phone, and co-owned equipment count badge in apps/web/src/components/partner/partner-card.tsx
- [ ] T043 [P] [US5] Create partner form component with React Hook Form + Zod (createPartnerSchema): name (required, non-empty) and phone fields in apps/web/src/components/partner/partner-form.tsx
- [ ] T044 [US5] Create partner list page fetching data via usePartnerList, rendering partner-card components in a grid, with "Add Partner" button in apps/web/src/pages/partners/list.tsx
- [ ] T045 [US5] Create partner detail page fetching data via usePartnerDetail, displaying partner name and phone, and a "Co-Owned Equipment" section listing all linked equipment (name, serial number, ownership percentage) in apps/web/src/pages/partners/detail.tsx
- [ ] T046 [US5] Create partner add/edit page using partner-form component with create/update mutations, navigates to detail on success in apps/web/src/pages/partners/form.tsx

### Mobile Implementation

- [ ] T047 [P] [US5] Create partner list screen with FlatList rendering partner items (name, phone, equipment count), pull-to-refresh, and add button in apps/mobile/app/(app)/partners/index.tsx
- [ ] T048 [P] [US5] Create partner detail screen displaying name, phone, and linked equipment list with ownership percentages in apps/mobile/app/(app)/partners/[id].tsx
- [ ] T049 [P] [US5] Create partner add/edit screen with form fields (name, phone) and create/update mutation in apps/mobile/app/(app)/partners/form.tsx

**Checkpoint**: Partner CRUD fully functional on web + mobile; partner detail shows linked equipment with ownership percentages

---

## Phase 9: User Story 6 — Sidebar Navigation and List Views (Priority: P6)

**Goal**: Sidebar navigation is polished; all list pages support table/card view toggle, search and filtering, empty states with "Add first [entity]" prompts, and pagination for large datasets

**Independent Test**: Navigate between Equipment, Suppliers, Partners via sidebar → toggle between table and card views → apply filters (equipment by type, ownership type, status; suppliers/partners by name search) → verify empty states when no data exists → verify pagination with many records

**Depends on**: US1, US4, US5 (all list pages must exist)

### Web Implementation

- [ ] T050 [US6] Add table/card view toggle and filter controls (search by name, filter by equipment type, ownership type, status with "Show inactive" toggle) to equipment list page in apps/web/src/pages/equipment/list.tsx
- [ ] T051 [P] [US6] Add table/card view toggle and name search filter to supplier list page in apps/web/src/pages/suppliers/list.tsx
- [ ] T052 [P] [US6] Add table/card view toggle and name search filter to partner list page in apps/web/src/pages/partners/list.tsx
- [ ] T053 [US6] Add empty state components with illustration and "Add your first [Equipment/Supplier/Partner]" CTA button to all three list pages when no records exist in apps/web/src/pages/equipment/list.tsx, apps/web/src/pages/suppliers/list.tsx, apps/web/src/pages/partners/list.tsx

### Mobile Implementation

- [ ] T054 [P] [US6] Add list style toggle (card/compact) and filter controls to equipment list screen in apps/mobile/app/(app)/equipment/index.tsx
- [ ] T055 [P] [US6] Add name search filter to supplier list screen in apps/mobile/app/(app)/suppliers/index.tsx
- [ ] T056 [P] [US6] Add name search filter to partner list screen in apps/mobile/app/(app)/partners/index.tsx
- [ ] T057 [US6] Add empty state displays with "Add first [entity]" prompt to all three mobile list screens in apps/mobile/app/(app)/equipment/index.tsx, apps/mobile/app/(app)/suppliers/index.tsx, apps/mobile/app/(app)/partners/index.tsx

**Checkpoint**: All list pages have table/card toggle, filters, search, empty states; sidebar navigation fully polished with active states

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, validation refinements, and final verification

- [ ] T058 Add client-side validation error display for duplicate serial numbers (equipment), duplicate names (suppliers, partners) by catching Supabase unique constraint errors and showing user-friendly messages in equipment-form, supplier-form, and partner-form components
- [ ] T059 Add pagination or infinite scroll to all list pages and screens handling datasets beyond initial page size
- [ ] T060 Verify equipment status filter works correctly: active equipment shown by default on all list pages, inactive accessible via "Show inactive" toggle, status badge visible on cards
- [ ] T061 Run quickstart.md verification steps: `npx supabase db reset`, `npx supabase db lint`, `npm run check-types`, `npm run build`, start web and mobile dev servers and verify end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (Types)
    ↓ (must complete first)
Phase 2: DB Migrations (Foundational)
    ↓ (must complete first)
Phase 3: Backend API Client (Foundational)
    ↓ (must complete first)
Phase 4–9: User Story Phases (see story dependencies below)
    ↓ (all stories complete)
Phase 10: Polish
```

### Agent Execution Model

Per plan.md, the 4-phase agent model maps to tasks:

| Agent | Tasks | Scope |
|-------|-------|-------|
| expert.db | T002–T004 | Phase 2: DB Migrations |
| expert.BE | T001, T005–T015 | Phase 1 (types) + Phase 3 (API client) |
| expert.FE_WEB | T016–T022, T027–T028, T031–T032, T034–T038, T042–T046, T050–T053, T058–T060 | Web tasks across all phases |
| expert.FE_EXPO | T023–T026, T029–T030, T033, T039–T041, T047–T049, T054–T057 | Mobile tasks across all phases |

**expert.FE_WEB and expert.FE_EXPO can run in parallel** once Phase 3 is complete.

### User Story Dependencies

```
US1 (P1) ← No story dependencies (only requires Phase 3 completion)
US2 (P2) ← Depends on US1 (equipment detail page must exist)
US3 (P3) ← Depends on US1 (equipment detail page must exist)
US4 (P4) ← No story dependencies (only requires Phase 3 completion)
US5 (P5) ← No story dependencies (only requires Phase 3 completion)
US6 (P6) ← Depends on US1, US4, US5 (all list pages must exist)
```

**Independent stories** (can run in parallel after Phase 3): US1, US4, US5

**Dependent stories**: US2 (after US1), US3 (after US1), US6 (after US1 + US4 + US5)

### Within Each User Story

1. Components (cards, forms) before pages (pages use components)
2. Web and mobile implementations can run in parallel (different apps)
3. Routes/navigation setup before pages that depend on them
4. List pages before detail/form pages (navigation entry point)

---

## Parallel Execution Examples

### Phase 3: Backend (Maximum Parallelism)

```
# All schemas in parallel (different files):
T006: equipment schemas  |  T007: supplier schemas  |  T008: partner schemas

# All services in parallel (different files):
T009: equipmentService  |  T010: supplierService  |  T011: partnerService

# All hooks in parallel (different files):
T012: useEquipment hooks  |  T013: useSupplier hooks  |  T014: usePartner hooks
```

### Phase 4: US1 (Web + Mobile in Parallel)

```
# Web components in parallel (different files):
T016: sidebar.tsx  |  T018: equipment-card.tsx  |  T019: equipment-form.tsx

# Mobile screens in parallel (different files, parallel with web):
T023: _layout.tsx  |  T024: equipment/index.tsx  |  T025: equipment/[id].tsx  |  T026: equipment/form.tsx
```

### Independent User Stories (Can Run in Parallel)

```
# After Phase 3, these stories have no cross-dependencies:
US1 (Phase 4)  |  US4 (Phase 7)  |  US5 (Phase 8)

# After US1 completes, these can run in parallel:
US2 (Phase 5)  |  US3 (Phase 6)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (types) → T001
2. Complete Phase 2: DB Migrations → T002–T004
3. Complete Phase 3: Backend API → T005–T015
4. Complete Phase 4: US1 Equipment CRUD → T016–T026
5. **STOP and VALIDATE**: Owner can create/edit/view/list equipment on web + mobile
6. Deploy/demo if ready — working equipment registry with sidebar navigation

### Incremental Delivery

1. **Setup + DB + Backend** → Foundation ready (T001–T015)
2. **+ US1** → Equipment registry (MVP!) → Deploy/Demo
3. **+ US2** → Rented equipment shows supplier info + transition warnings → Deploy/Demo
4. **+ US3** → Partner ownership tracking on owned equipment → Deploy/Demo
5. **+ US4** → Full supplier management pages → Deploy/Demo
6. **+ US5** → Full partner management pages → Deploy/Demo
7. **+ US6** → Polished list views with table/card toggle, filters, empty states → Deploy/Demo
8. **+ Polish** → Edge cases, validation, pagination → Final release

### Recommended Execution Order (Single Developer)

Follow phases sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

### Parallel Team Strategy

With 2+ developers after Phases 1–3 are complete:
- **Dev A (expert.FE_WEB)**: US1 web → US2 web → US3 web → US4 web → US5 web → US6 web → Polish
- **Dev B (expert.FE_EXPO)**: US1 mobile → US2 mobile → US3 mobile → US4 mobile → US5 mobile → US6 mobile → Polish

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- No test tasks generated (testing not configured per plan.md)
- Each user story is independently testable at its checkpoint
- Web and mobile implementations share the same backend (Phase 3) and can run in parallel
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate the story independently
