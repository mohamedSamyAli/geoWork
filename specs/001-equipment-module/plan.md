# Implementation Plan: Equipment Module

**Branch**: `001-equipment-module` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-equipment-module/spec.md`

**Implementation Phases**: This feature will be implemented in **4 phases**, each by a different agent:
1. **DB Migrations** (expert.db agent) — schema, RLS, triggers, seed data
2. **Backend / API Client** (expert.BE agent) — types, services, hooks, schemas in shared packages
3. **Frontend Web** (expert.FE_WEB agent) — React web app pages, components, sidebar navigation
4. **Frontend Mobile** (expert.FE_EXPO agent) — React Native/Expo screens and components

## Summary

Build the equipment management module for a multi-tenant surveying SaaS. The module introduces 5 new database tables (equipment, suppliers, partners, equipment_partners, equipment_types), extends the existing Supabase-based architecture with new services/hooks in @repo/api-client, and adds sidebar navigation with list/detail/form pages across both web and mobile apps. Equipment supports two ownership modes: "rented" (linked to a supplier with costs) and "owned" (with optional partner co-ownership percentages). All data is company-scoped with RLS enforcement.

## Technical Context

**Language/Version**: TypeScript 5.9.2 (strict mode)
**Primary Dependencies**: React 19, Vite 7, React Router v7, React Hook Form + Zod, TanStack React Query v5, Supabase JS v2, Expo 54, React Native 0.81
**Storage**: PostgreSQL 17 via Supabase (existing: profiles, companies, company_members tables)
**Testing**: None configured (gap — not blocking for this feature)
**Target Platform**: Web (React + Vite) + Mobile (React Native + Expo)
**Project Type**: Monorepo (Turborepo) with web + mobile apps + shared packages
**Performance Goals**: Standard web/mobile app expectations (< 1s page loads, < 10s search)
**Constraints**: All data company-scoped via RLS, no custom backend server (Supabase SDK direct)
**Scale/Scope**: Small-medium surveying companies (< 500 equipment per company)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is an unfilled template — no gates to enforce. Proceeding without constraints.

## Project Structure

### Documentation (this feature)

```text
specs/001-equipment-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── equipment.ts     # Equipment service contract
│   ├── suppliers.ts     # Supplier service contract
│   ├── partners.ts      # Partner service contract
│   └── types.ts         # New TypeScript types to add to @repo/types
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Existing monorepo structure — new files marked with (+)
supabase/
└── migrations/
    ├── 20250209000001_init_schema.sql        # existing
    ├── 20250209000002_rls_policies.sql       # existing
    ├── 20250209000003_auth_trigger.sql       # existing
    ├── 20250209000004_onboarding_rpc.sql     # existing
    ├── 20250211000001_equipment_schema.sql   # (+) Phase 1: DB
    ├── 20250211000002_equipment_rls.sql      # (+) Phase 1: DB
    └── 20250211000003_equipment_seed.sql     # (+) Phase 1: DB (seed default types)

packages/types/src/
└── index.ts              # extend with equipment types (+)

packages/api-client/src/
├── services/
│   ├── equipment.ts      # (+) Phase 2: Backend
│   ├── supplier.ts       # (+) Phase 2: Backend
│   └── partner.ts        # (+) Phase 2: Backend
├── hooks/
│   ├── use-equipment.ts  # (+) Phase 2: Backend
│   ├── use-supplier.ts   # (+) Phase 2: Backend
│   └── use-partner.ts    # (+) Phase 2: Backend
├── schemas/
│   ├── equipment.ts      # (+) Phase 2: Backend
│   ├── supplier.ts       # (+) Phase 2: Backend
│   └── partner.ts        # (+) Phase 2: Backend
├── lib/
│   └── query-keys.ts     # extend with new keys (+)
└── index.ts              # extend with new exports (+)

apps/web/src/
├── components/
│   ├── layout/
│   │   └── sidebar.tsx           # (+) Phase 3: Web
│   ├── equipment/
│   │   ├── equipment-form.tsx    # (+) add/edit form
│   │   ├── equipment-card.tsx    # (+) card view item
│   │   └── partner-ownership.tsx # (+) ownership section
│   ├── supplier/
│   │   ├── supplier-form.tsx     # (+) add/edit form
│   │   └── supplier-card.tsx     # (+) card view item
│   └── partner/
│       ├── partner-form.tsx      # (+) add/edit form
│       └── partner-card.tsx      # (+) card view item
├── pages/
│   ├── equipment/
│   │   ├── list.tsx              # (+) list with table/card toggle
│   │   ├── detail.tsx            # (+) view page
│   │   └── form.tsx              # (+) add/edit page
│   ├── suppliers/
│   │   ├── list.tsx              # (+)
│   │   ├── detail.tsx            # (+)
│   │   └── form.tsx              # (+)
│   └── partners/
│       ├── list.tsx              # (+)
│       ├── detail.tsx            # (+)
│       └── form.tsx              # (+)
└── App.tsx                       # update routes (+)

apps/mobile/app/
├── (app)/
│   ├── equipment/
│   │   ├── index.tsx             # (+) Phase 4: Mobile — list
│   │   ├── [id].tsx              # (+) detail
│   │   └── form.tsx              # (+) add/edit
│   ├── suppliers/
│   │   ├── index.tsx             # (+)
│   │   ├── [id].tsx              # (+)
│   │   └── form.tsx              # (+)
│   └── partners/
│       ├── index.tsx             # (+)
│       ├── [id].tsx              # (+)
│       └── form.tsx              # (+)
└── (tabs)/
    └── _layout.tsx               # update tab navigation (+)
```

**Structure Decision**: Extends existing monorepo. DB migrations in `supabase/migrations/`, shared types and API client in `packages/`, web pages in `apps/web/src/pages/`, mobile screens in `apps/mobile/app/`. No new packages needed — extends existing ones.

## Complexity Tracking

No constitution violations — no complexity justification needed.
