# Research: Equipment Module

**Feature**: 001-equipment-module
**Date**: 2026-02-11

## Research Findings

### R-001: Equipment Type Management (Predefined + Custom)

**Decision**: Use a dedicated `equipment_types` table with `company_id` nullable.
- `company_id = NULL` → system-provided defaults (seeded via migration)
- `company_id = <uuid>` → company-specific custom types
- Query: `WHERE company_id IS NULL OR company_id = :user_company_id`

**Rationale**: A separate table provides referential integrity, prevents typos/duplicates, enables consistent dropdown filtering, and cleanly separates system vs custom types without a boolean flag.

**Alternatives considered**:
- Free-text field on equipment → rejected (inconsistent data, poor filtering)
- Enum type in Postgres → rejected (cannot be extended per-company at runtime)
- Boolean `is_system` column → rejected (nullable company_id is more natural for querying)

---

### R-002: Rental Cost Storage Model

**Decision**: Store `supplier_id`, `monthly_rent`, and `daily_rent` directly on the `equipment` table as nullable columns.

**Rationale**: Since each equipment can only be linked to one supplier at a time (spec assumption), a join table adds unnecessary complexity. Nullable columns are cleaner — they're NULL when ownership_type = 'owned' and populated when 'rented'. A CHECK constraint ensures consistency.

**Alternatives considered**:
- Separate `equipment_rentals` join table → rejected (1:1 relationship doesn't justify a join table)
- Storing rental history → rejected (out of scope — spec says current rental info only)

---

### R-003: Partner Ownership Percentage Constraint

**Decision**: Use a database trigger function `check_equipment_partner_total()` to enforce that the sum of all partner percentages for a single equipment record does not exceed 100.00.

**Rationale**: A per-row CHECK constraint cannot validate across multiple rows. A trigger on INSERT/UPDATE on the `equipment_partners` table can sum all percentages for the equipment and reject if total > 100.00. This provides server-side safety regardless of client behavior.

**Alternatives considered**:
- Client-only validation → rejected (insufficient — data integrity must be enforced at DB level)
- Stored function called before insert → achieves same result, but trigger is more automatic
- Materialized sum column on equipment → over-engineered for this scale

---

### R-004: Equipment Status (Active/Inactive) vs Soft Delete

**Decision**: Add an `equipment_status` enum ('active', 'inactive') and a `status` column on the equipment table. Default to 'active'. No soft delete pattern (no `deleted_at` column).

**Rationale**: The spec explicitly says "no deletion — only archive/deactivate." A status enum is simpler than a deleted_at timestamp and directly maps to the business language. List queries filter on `status = 'active'` by default.

**Alternatives considered**:
- `deleted_at` timestamp (soft delete) → rejected (spec says archive, not delete; enum is clearer)
- Boolean `is_active` → rejected (enum is more extensible if future statuses are needed)

---

### R-005: RLS Strategy for New Tables

**Decision**: Follow the exact same RLS pattern as the existing schema:
1. Enable RLS on all new tables (deny by default)
2. Reuse existing `get_my_company_ids()` helper for company-scoped SELECT policies
3. Reuse existing `has_company_role()` for owner-only write policies
4. All new tables have `company_id` column for direct scoping (except `equipment_partners` which scopes via equipment's company_id)

**Rationale**: Consistency with existing RLS implementation ensures predictable security behavior and reduces cognitive load.

---

### R-006: API Client Pattern for Equipment Module

**Decision**: Follow the exact existing pattern in @repo/api-client:
- **Services**: Object with async methods returning `Promise<Result<T>>`
- **Hooks**: useQuery for reads, useMutation for writes, invalidating related query keys
- **Schemas**: Zod objects for form validation
- **Query keys**: Extend existing `queryKeys` object

**Rationale**: The existing codebase has a clean, well-established pattern. Deviation would create inconsistency.

---

### R-007: Sidebar Navigation Approach

**Decision**: Add a persistent left sidebar component to the web app layout. On mobile, extend the existing tab navigation or add a drawer. The sidebar shows: Equipment, Partners, Suppliers as primary navigation items.

**Rationale**: The web app currently has no sidebar (just pages for login/register/home). This is new layout infrastructure. On mobile, Expo Router's tab-based layout is already in place and should be extended.

---

### R-008: 4-Phase Implementation Strategy

**Decision**: Implementation in 4 sequential phases, each executed by a specialized agent:

| Phase | Agent | Scope | Depends On |
|-------|-------|-------|------------|
| 1. DB Migrations | expert.db | Tables, enums, RLS, triggers, seed data | Nothing |
| 2. Backend/API | expert.BE | @repo/types, @repo/api-client (services, hooks, schemas, query-keys) | Phase 1 |
| 3. Frontend Web | expert.FE_WEB | apps/web — sidebar, pages, components, routes | Phase 2 |
| 4. Frontend Mobile | expert.FE_EXPO | apps/mobile — screens, navigation, components | Phase 2 |

**Rationale**: Phases 3 and 4 can potentially run in parallel since both depend on Phase 2 (shared API client) but not on each other. Phases 1→2 are strictly sequential.
