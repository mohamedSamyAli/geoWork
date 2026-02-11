# Workers Module - API Schema Documentation

**Generated from:** Database Migrations (Phase 1)
**Target Audience:** Backend Service Developers
**Last Updated:** 2026-02-12

---

## Overview

This document describes the database schema for the Workers Module, providing backend developers with the complete context needed to build service layers, API endpoints, and data transformations.

---

## Tables

### `workers`

Worker profiles with salary information and job classification.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | false | gen_random_uuid() | Primary key |
| `company_id` | uuid | false | - | FK to companies (tenant) |
| `name` | text | false | - | Worker full name, max 100 chars |
| `phone` | text | false | - | Contact phone, max 20 chars, unique per company |
| `category` | worker_category | false | - | 'engineer' \| 'surveyor' \| 'assistant' |
| `salary_month` | numeric(10,2) | false | - | Monthly salary, non-negative |
| `salary_day` | numeric(10,2) | false | - | Daily salary, non-negative |
| `status` | worker_status | false | 'active' | 'active' \| 'inactive' |
| `created_at` | timestamptz | false | now() | Creation timestamp |
| `updated_at` | timestamptz | false | now() | Last update timestamp |
| `deleted_at` | timestamptz | true | - | Soft-delete timestamp |

**Constraints:**
- `workers_company_phone_unique`: (company_id, phone) must be unique
- `workers_salary_positive`: At least one of salary_month OR salary_day must be > 0

**Indexes:**
- `idx_workers_company_id` on (company_id)
- `idx_workers_company_status` on (company_id, status) WHERE deleted_at IS NULL
- `idx_workers_company_category` on (company_id, category) WHERE deleted_at IS NULL
- `idx_workers_deleted_at` on (deleted_at) WHERE deleted_at IS NOT NULL

---

### `software`

Master data for software skills (e.g., AutoCAD, Civil3D).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | false | gen_random_uuid() | Primary key |
| `company_id` | uuid | true | - | FK to companies (NULL = system-wide) |
| `name` | text | false | - | Software name, max 100 chars |
| `is_seeded` | boolean | false | false | System seeded flag |
| `created_at` | timestamptz | false | now() | Creation timestamp |
| `updated_at` | timestamptz | false | now() | Last update timestamp |

**Constraints:**
- `software_company_name_unique`: (company_id, name) unique
- `uq_software_system_name`: name unique WHERE company_id IS NULL

**Indexes:**
- `idx_software_company_id` on (company_id)

---

### `equipment_brands`

Master data for equipment manufacturer brands.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | false | gen_random_uuid() | Primary key |
| `company_id` | uuid | true | - | FK to companies (NULL = system-wide) |
| `name` | text | false | - | Brand name, max 100 chars |
| `created_at` | timestamptz | false | now() | Creation timestamp |
| `updated_at` | timestamptz | false | now() | Last update timestamp |

**Constraints:**
- `equipment_brands_company_name_unique`: (company_id, name) unique
- `uq_equipment_brands_system_name`: name unique WHERE company_id IS NULL

**Indexes:**
- `idx_equipment_brands_company_id` on (company_id)

---

### `worker_equipment_skills`

Worker equipment proficiency with 1-5 star ratings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | false | gen_random_uuid() | Primary key |
| `worker_id` | uuid | false | - | FK to workers (CASCADE) |
| `equipment_type` | text | false | - | Equipment type, max 100 chars |
| `equipment_brand` | text | false | - | Equipment brand, max 100 chars |
| `proficiency_rating` | integer | false | - | 1-5 star rating |
| `created_at` | timestamptz | false | now() | Creation timestamp |
| `updated_at` | timestamptz | false | now() | Last update timestamp |

**Constraints:**
- `worker_equipment_skills_unique`: (worker_id, equipment_type, equipment_brand) unique
- CHECK: proficiency_rating BETWEEN 1 AND 5

**Indexes:**
- `idx_worker_equipment_skills_worker_id` on (worker_id)

**Note:** `equipment_type` and `equipment_brand` are stored as TEXT (not FKs) for flexibility with the quick-add feature.

---

### `worker_software_skills`

Links workers to software from the master software table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | false | gen_random_uuid() | Primary key |
| `worker_id` | uuid | false | - | FK to workers (CASCADE) |
| `software_id` | uuid | false | - | FK to software (CASCADE) |
| `created_at` | timestamptz | false | now() | Creation timestamp |

**Constraints:**
- `worker_software_skills_unique`: (worker_id, software_id) unique

**Indexes:**
- `idx_worker_software_skills_worker_id` on (worker_id)
- `idx_worker_software_skills_software_id` on (software_id)

---

## Enums

### `worker_category`

```
'engineer'
'surveyor'
'assistant'
```

### `worker_status`

```
'active'      - Worker is currently employed
'inactive'    - Worker has been archived (soft delete)
```

### `proficiency_rating` (implied, stored as integer with CHECK constraint)

```
1 - Beginner (requires supervision)
2 - Basic (can work with guidance)
3 - Competent (works independently)
4 - Advanced (handles complex tasks)
5 - Expert (can train others)
```

---

## Views

### `v_workers_with_equipment_skills`

Returns workers with equipment skills aggregated as JSONB.

**Columns:** All worker columns + `equipment_skills` (jsonb array)

**Example equipment_skills item:**
```json
{
  "id": "uuid",
  "equipment_type": "Total Station",
  "equipment_brand": "Topcon",
  "proficiency_rating": 4,
  "created_at": "2026-02-12T10:00:00Z"
}
```

---

### `v_workers_with_software_skills`

Returns workers with software skills aggregated as JSONB (including software names).

**Columns:** All worker columns + `software_skills` (jsonb array)

**Example software_skills item:**
```json
{
  "id": "uuid",
  "software_id": "uuid",
  "software_name": "AutoCAD",
  "created_at": "2026-02-12T10:00:00Z"
}
```

---

### `v_workers_with_skills`

Combined view returning workers with both equipment and software skills.

**Columns:** All worker columns + `equipment_skills` (jsonb) + `software_skills` (jsonb)

---

### `v_software_list`

Ordered list of software for UI dropdowns.

**Columns:**
- `id`, `company_id`, `name`, `is_seeded`, `created_at`
- `is_system` (boolean) - true if company_id IS NULL

**Order:** `is_seeded DESC, name ASC` (system software first, then alphabetical)

---

### `v_equipment_brands_list`

Ordered list of equipment brands for UI dropdowns.

**Columns:**
- `id`, `company_id`, `name`, `created_at`
- `is_system` (boolean) - true if company_id IS NULL

**Order:** `name ASC`

---

## Relationships (ER Diagram Summary)

```
companies (1) ----< (N) workers (1) ----< (N) worker_equipment_skills
                          |
                          +----< (N) worker_software_skills
                                    |
                                    v
                                software (M)
                                  ^
                                  |
companies (1) ----< (N)           |

companies (1) ----< (N) equipment_brands
```

**Relationship Details:**

| From | To | Cardinality | On Delete |
|------|-----|-------------|-----------|
| companies | workers | 1:N | CASCADE |
| companies | software | 1:N | CASCADE |
| companies | equipment_brands | 1:N | CASCADE |
| workers | worker_equipment_skills | 1:N | CASCADE |
| workers | worker_software_skills | 1:N | CASCADE |
| software | worker_software_skills | 1:N | CASCADE |

---

## RLS Security Model

All tables use Row Level Security with the following helper functions:

- `get_my_company_ids()` - Returns set of uuid for user's companies
- `has_company_role(company_id, role)` - Checks if user has role in company

**Access Matrix:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| software | All (system + own company) | Owners only | Owners only (own company) | Owners only (own company) |
| equipment_brands | All (system + own company) | Owners only | Owners only (own company) | Owners only (own company) |
| workers | Members (own company, not deleted) | Owners only | Owners only | **Blocked** (use soft delete) |
| worker_equipment_skills | Members (via worker) | Owners (via worker) | Owners (via worker) | Owners (via worker) |
| worker_software_skills | Members (via worker) | Owners (via worker) | N/A | Owners (via worker) |

---

## Expected API Operations

### Workers CRUD

| Operation | SQL Pattern | Notes |
|-----------|-------------|-------|
| List workers | `SELECT * FROM workers WHERE company_id = $1 AND deleted_at IS NULL` | Add filters for status, category |
| Get worker | `SELECT * FROM workers WHERE id = $1 AND deleted_at IS NULL` | Join with skills tables |
| Create worker | `INSERT INTO workers (company_id, name, phone, category, salary_month, salary_day)` | Return created row |
| Update worker | `UPDATE workers SET ... WHERE id = $1` | Only non-deleted |
| Archive worker | `UPDATE workers SET status = 'inactive' WHERE id = $1` | Soft delete via status |
| Reactivate worker | `UPDATE workers SET status = 'active' WHERE id = $1` | |

### Equipment Skills

| Operation | SQL Pattern | Notes |
|-----------|-------------|-------|
| List skills | `SELECT * FROM worker_equipment_skills WHERE worker_id = $1` | |
| Add skill | `INSERT INTO worker_equipment_skills (worker_id, equipment_type, equipment_brand, proficiency_rating)` | On conflict do nothing or update |
| Update rating | `UPDATE worker_equipment_skills SET proficiency_rating = $1 WHERE id = $2` | |
| Remove skill | `DELETE FROM worker_equipment_skills WHERE id = $1` | |

### Software Skills

| Operation | SQL Pattern | Notes |
|-----------|-------------|-------|
| List skills | `SELECT wss.*, s.name FROM worker_software_skills wss JOIN software s ON s.id = wss.software_id WHERE worker_id = $1` | |
| Add skill | `INSERT INTO worker_software_skills (worker_id, software_id)` | |
| Remove skill | `DELETE FROM worker_software_skills WHERE id = $1` | |

### Master Data (Quick-Add)

| Operation | SQL Pattern | Notes |
|-----------|-------------|-------|
| List software | `SELECT * FROM v_software_list` | Returns system + company software |
| Create software | `INSERT INTO software (company_id, name, is_seeded)` | is_seeded = false |
| List brands | `SELECT * FROM v_equipment_brands_list` | Returns system + company brands |
| Create brand | `INSERT INTO equipment_brands (company_id, name)` | |
| List equipment types | `SELECT * FROM equipment_types WHERE company_id IS NULL OR company_id = $1` | Reuse from equipment module |

---

## Important Notes for Backend Developers

### 1. Soft Delete Pattern

Workers are soft-deleted. Always filter by `deleted_at IS NULL` in SELECT queries. Do NOT use hard DELETE.

### 2. Equipment Type/Brand Storage

`equipment_type` and `equipment_brand` in `worker_equipment_skills` are stored as TEXT, not foreign keys. This allows:
- Quick-add of new types/brands without schema changes
- Flexibility for future equipment types
- Reuse of existing `equipment_types` table via separate query

### 3. System vs Company Data

- System data: `company_id IS NULL` (visible to all, read-only via API)
- Company data: `company_id NOT NULL` (visible only to owning company, writable by owners)

### 4. Salary Validation

The database enforces: `salary_month > 0 OR salary_day > 0`
Backend should validate both are >= 0, and at least one is > 0 before insert.

### 5. Unique Constraints

| Table | Constraint | Error Code (Postgres) |
|-------|-------------|----------------------|
| workers | (company_id, phone) | 23505 (unique_violation) |
| software | (company_id, name) | 23505 |
| equipment_brands | (company_id, name) | 23505 |
| worker_equipment_skills | (worker_id, equipment_type, equipment_brand) | 23505 |
| worker_software_skills | (worker_id, software_id) | 23505 |

Map these to user-friendly error messages in your service layer.

---

## TypeScript Types Reference

Use these as reference when building TypeScript interfaces:

```typescript
// Enums
type WorkerCategory = 'engineer' | 'surveyor' | 'assistant';
type WorkerStatus = 'active' | 'inactive';
type ProficiencyRating = 1 | 2 | 3 | 4 | 5;

// Database Row Types
interface Worker {
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

interface Software {
  id: string;
  company_id: string | null;
  name: string;
  is_seeded: boolean;
  created_at: string;
  updated_at: string;
}

interface EquipmentBrand {
  id: string;
  company_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

interface WorkerEquipmentSkill {
  id: string;
  worker_id: string;
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
  created_at: string;
  updated_at: string;
}

interface WorkerSoftwareSkill {
  id: string;
  worker_id: string;
  software_id: string;
  created_at: string;
}

// Joined Types (from views)
interface WorkerWithSkills extends Worker {
  equipment_skills: WorkerEquipmentSkill[];
  software_skills: Array<WorkerSoftwareSkill & { software_name: string }>;
}
```

---

**Document End**

**Next Step:** Backend services implementation (Phase 2)
