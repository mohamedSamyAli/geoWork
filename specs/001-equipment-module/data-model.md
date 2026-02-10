# Data Model: Equipment Module

**Feature**: 001-equipment-module
**Date**: 2026-02-11
**Extends**: Existing schema (profiles, companies, company_members)

## ERD Summary

```
companies (existing)
    │
    │ 1:N
    ├──────────────────────────────────────────────┐
    │                  │                            │
    ▼                  ▼                            ▼
equipment          suppliers                   partners
    id (PK)            id (PK)                     id (PK)
    company_id (FK)    company_id (FK)             company_id (FK)
    name               name (UNIQUE/company)       name (UNIQUE/company)
    serial_number      phone                       phone
    equipment_type_id  created_at                  created_at
    model              updated_at                  updated_at
    ownership_type                                     │
    status                                             │
    supplier_id (FK) ──────► suppliers                  │
    monthly_rent                                       │
    daily_rent                                         │
    created_at                                         │
    updated_at                                         │
        │                                              │
        │ N:M (via equipment_partners)                 │
        └──────────────► equipment_partners ◄──────────┘
                            id (PK)
                            equipment_id (FK)
                            partner_id (FK)
                            percentage
                            created_at

equipment_types
    id (PK)
    company_id (FK, nullable)   ← NULL = system default
    name
    created_at
```

## New Enums

### `ownership_type`

```sql
CREATE TYPE public.ownership_type AS ENUM ('owned', 'rented');
```

### `equipment_status`

```sql
CREATE TYPE public.equipment_status AS ENUM ('active', 'inactive');
```

## New Tables

### 1. `equipment_types`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `company_id` | uuid | FK → companies(id) ON DELETE CASCADE, NULLABLE | NULL = system-provided default type |
| `name` | text | NOT NULL, CHECK(char_length(name) > 0) | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique constraints**:
- `UNIQUE (company_id, name)` — prevents duplicate type names within a company
- Note: system types (company_id IS NULL) need a partial unique index: `UNIQUE (name) WHERE company_id IS NULL`

**Seed data** (system defaults with company_id = NULL):
- Total Station
- GPS / GNSS
- Level
- Theodolite
- Drone / UAV
- 3D Scanner
- Echo Sounder
- Other

---

### 2. `suppliers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `company_id` | uuid | FK → companies(id) ON DELETE CASCADE, NOT NULL | Tenant scope |
| `name` | text | NOT NULL, CHECK(char_length(name) > 0) | |
| `phone` | text | NULLABLE | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique constraints**: `UNIQUE (company_id, name)`

**Indexes**:
- `idx_suppliers_company_id ON suppliers (company_id)` — RLS performance

**Triggers**:
- `trg_suppliers_updated_at` → `set_updated_at()` (reuse existing function)

---

### 3. `partners`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `company_id` | uuid | FK → companies(id) ON DELETE CASCADE, NOT NULL | Tenant scope |
| `name` | text | NOT NULL, CHECK(char_length(name) > 0) | |
| `phone` | text | NULLABLE | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique constraints**: `UNIQUE (company_id, name)`

**Indexes**:
- `idx_partners_company_id ON partners (company_id)` — RLS performance

**Triggers**:
- `trg_partners_updated_at` → `set_updated_at()` (reuse existing function)

---

### 4. `equipment`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `company_id` | uuid | FK → companies(id) ON DELETE CASCADE, NOT NULL | Tenant scope |
| `name` | text | NOT NULL, CHECK(char_length(name) > 0) | |
| `serial_number` | text | NOT NULL | |
| `equipment_type_id` | uuid | FK → equipment_types(id) ON DELETE RESTRICT, NOT NULL | Cannot delete a type in use |
| `model` | text | NULLABLE | |
| `ownership_type` | ownership_type | NOT NULL | 'owned' or 'rented' |
| `status` | equipment_status | NOT NULL, DEFAULT 'active' | 'active' or 'inactive' |
| `supplier_id` | uuid | FK → suppliers(id) ON DELETE RESTRICT, NULLABLE | Required when rented, NULL when owned |
| `monthly_rent` | numeric(12,2) | NULLABLE | Required when rented, NULL when owned |
| `daily_rent` | numeric(12,2) | NULLABLE | Required when rented, NULL when owned |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique constraints**: `UNIQUE (company_id, serial_number)`

**Check constraints**:
```sql
-- Rented equipment must have supplier and costs
CHECK (
  (ownership_type = 'rented' AND supplier_id IS NOT NULL AND monthly_rent IS NOT NULL AND daily_rent IS NOT NULL)
  OR
  (ownership_type = 'owned' AND supplier_id IS NULL AND monthly_rent IS NULL AND daily_rent IS NULL)
)
```

**Indexes**:
- `idx_equipment_company_id ON equipment (company_id)` — RLS performance
- `idx_equipment_supplier_id ON equipment (supplier_id) WHERE supplier_id IS NOT NULL` — supplier detail page
- `idx_equipment_type_id ON equipment (equipment_type_id)` — type filtering
- `idx_equipment_status ON equipment (company_id, status)` — active/inactive filtering

**Triggers**:
- `trg_equipment_updated_at` → `set_updated_at()` (reuse existing function)

---

### 5. `equipment_partners`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `equipment_id` | uuid | FK → equipment(id) ON DELETE CASCADE, NOT NULL | |
| `partner_id` | uuid | FK → partners(id) ON DELETE CASCADE, NOT NULL | |
| `percentage` | numeric(5,2) | NOT NULL, CHECK(percentage >= 1 AND percentage <= 99) | 2 decimal places |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique constraints**: `UNIQUE (equipment_id, partner_id)` — a partner can only have one ownership entry per equipment

**Indexes**:
- `idx_equipment_partners_equipment_id ON equipment_partners (equipment_id)` — ownership display
- `idx_equipment_partners_partner_id ON equipment_partners (partner_id)` — partner detail page

---

## Trigger Functions

### `check_equipment_partner_total()`

Enforces that the sum of all partner percentages for a single equipment does not exceed 100.00.

```sql
CREATE OR REPLACE FUNCTION public.check_equipment_partner_total()
RETURNS trigger AS $$
DECLARE
  _total numeric;
BEGIN
  SELECT COALESCE(SUM(percentage), 0) INTO _total
  FROM public.equipment_partners
  WHERE equipment_id = NEW.equipment_id
    AND id IS DISTINCT FROM NEW.id;  -- exclude current row on UPDATE

  IF (_total + NEW.percentage) > 100 THEN
    RAISE EXCEPTION 'Total partner ownership would be % which exceeds 100%%',
      (_total + NEW.percentage);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied as: `BEFORE INSERT OR UPDATE ON equipment_partners FOR EACH ROW`

---

## RLS Policies

### `equipment_types`

| Policy | Operation | Rule |
|--------|-----------|------|
| `et_select_visible` | SELECT | `company_id IS NULL OR company_id IN (get_my_company_ids())` |
| `et_insert_owner` | INSERT | `has_company_role(company_id, 'owner')` (only for custom types) |
| `et_delete_owner` | DELETE | `has_company_role(company_id, 'owner') AND company_id IS NOT NULL` (cannot delete system types) |

### `suppliers`

| Policy | Operation | Rule |
|--------|-----------|------|
| `suppliers_select_member` | SELECT | `company_id IN (get_my_company_ids())` |
| `suppliers_insert_owner` | INSERT | `has_company_role(company_id, 'owner')` |
| `suppliers_update_owner` | UPDATE | `has_company_role(company_id, 'owner')` |
| `suppliers_delete_owner` | DELETE | `has_company_role(company_id, 'owner')` |

### `partners`

| Policy | Operation | Rule |
|--------|-----------|------|
| `partners_select_member` | SELECT | `company_id IN (get_my_company_ids())` |
| `partners_insert_owner` | INSERT | `has_company_role(company_id, 'owner')` |
| `partners_update_owner` | UPDATE | `has_company_role(company_id, 'owner')` |
| `partners_delete_owner` | DELETE | `has_company_role(company_id, 'owner')` |

### `equipment`

| Policy | Operation | Rule |
|--------|-----------|------|
| `equipment_select_member` | SELECT | `company_id IN (get_my_company_ids())` |
| `equipment_insert_owner` | INSERT | `has_company_role(company_id, 'owner')` |
| `equipment_update_owner` | UPDATE | `has_company_role(company_id, 'owner')` |

> No DELETE policy — equipment cannot be deleted (FR-024).

### `equipment_partners`

| Policy | Operation | Rule |
|--------|-----------|------|
| `ep_select_member` | SELECT | `equipment_id IN (SELECT id FROM equipment WHERE company_id IN (get_my_company_ids()))` |
| `ep_insert_owner` | INSERT | Equipment's company owner check via subquery |
| `ep_update_owner` | UPDATE | Equipment's company owner check via subquery |
| `ep_delete_owner` | DELETE | Equipment's company owner check via subquery |

---

## Relationships Summary

| From | To | Cardinality | FK Column | ON DELETE |
|------|----|-------------|-----------|-----------|
| equipment | companies | N:1 | company_id | CASCADE |
| equipment | equipment_types | N:1 | equipment_type_id | RESTRICT |
| equipment | suppliers | N:1 | supplier_id (nullable) | RESTRICT |
| suppliers | companies | N:1 | company_id | CASCADE |
| partners | companies | N:1 | company_id | CASCADE |
| equipment_partners | equipment | N:1 | equipment_id | CASCADE |
| equipment_partners | partners | N:1 | partner_id | CASCADE |
| equipment_types | companies | N:1 | company_id (nullable) | CASCADE |

---

## State Transitions

### Equipment Status

```
[created] → active → inactive → active (re-activated)
                                    ↑
                                    └── can toggle back and forth
```

No terminal state — equipment can always be reactivated.

### Ownership Type Transitions

```
owned ←→ rented
```

Changing from owned → rented:
- System warns that partner ownership data will be removed
- On confirmation: delete all equipment_partners rows, set supplier_id + costs

Changing from rented → owned:
- System warns that supplier/rental data will be removed
- On confirmation: set supplier_id = NULL, monthly_rent = NULL, daily_rent = NULL
