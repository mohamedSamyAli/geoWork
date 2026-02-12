# Workers Module - Implementation Tasks

**Based on:** [prd.md](./prd.md)
**Module ID:** 002-worker-module
**Last Updated:** 2026-02-12
**Status:** Ready for Implementation

---

## Overview

This document breaks down the Workers Module implementation into 4 parts:
1. **Database Migrations** - Schema, RLS policies, seed data
2. **Backend Services** - API client, types, schemas
3. **Web App** - React components, pages, forms
4. **Mobile App** - React Native screens, components

Each part produces documentation for the next step:
- Database → Backend (API schema documentation)
- Backend → Web/Mobile (service interface documentation)

---

## Part 1: Database Migrations

### Task 1.1: Create Workers Schema Migration

**File:** `supabase/migrations/20250212000001_workers_schema.sql`

**Objective:** Create all tables, enums, and constraints for the workers module.

**Tables to Create:**
| Table | Purpose |
|-------|---------|
| `worker_category` | Enum for engineer, surveyor, assistant |
| `workers` | Main worker profiles |
| `software` | Master data for software skills |
| `equipment_types` | Reuse from equipment module or create new reference |
| `equipment_brands` | Master data for equipment brands |
| `worker_equipment_skills` | Worker equipment skills with ratings |
| `worker_software_skills` | Worker software skills |

**SQL Structure:**

```sql
-- ============================================================
-- Migration: Workers module - schema
-- Module: 002-worker-module
-- ============================================================

-- 1. Create Enums
CREATE TYPE public.worker_category AS ENUM ('engineer', 'surveyor', 'assistant');
CREATE TYPE public.worker_status AS ENUM ('active', 'inactive');

-- 2. Software table (master data)
CREATE TABLE public.software (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0),
  is_seeded  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, name)
);

-- System-wide unique for seeded software
CREATE UNIQUE INDEX uq_software_system_name
  ON public.software (name) WHERE company_id IS NULL;

-- 3. Equipment brands table (master data)
CREATE TABLE public.equipment_brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, name)
);

CREATE UNIQUE INDEX uq_equipment_brands_system_name
  ON public.equipment_brands (name) WHERE company_id IS NULL;

-- 4. Workers table
CREATE TABLE public.workers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) > 0),
  phone         text NOT NULL CHECK (char_length(phone) > 0),
  category      public.worker_category NOT NULL,
  salary_month  numeric(10,2) NOT NULL CHECK (salary_month >= 0),
  salary_day    numeric(10,2) NOT NULL CHECK (salary_day >= 0),
  status        public.worker_status NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  UNIQUE (company_id, phone)
);

CREATE INDEX idx_workers_company_id ON public.workers (company_id);
CREATE INDEX idx_workers_category ON public.workers (company_id, category);
CREATE INDEX idx_workers_status ON public.workers (company_id, status);

CREATE TRIGGER trg_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Worker equipment skills table
CREATE TABLE public.worker_equipment_skills (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id          uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  equipment_type     text NOT NULL CHECK (char_length(equipment_type) > 0),
  equipment_brand    text NOT NULL CHECK (char_length(equipment_brand) > 0),
  proficiency_rating integer NOT NULL CHECK (proficiency_rating BETWEEN 1 AND 5),
  created_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE (worker_id, equipment_type, equipment_brand)
);

CREATE INDEX idx_worker_equipment_skills_worker_id
  ON public.worker_equipment_skills (worker_id);

-- 6. Worker software skills table
CREATE TABLE public.worker_software_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id  uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  software_id uuid NOT NULL REFERENCES public.software(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (worker_id, software_id)
);

CREATE INDEX idx_worker_software_skills_worker_id
  ON public.worker_software_skills (worker_id);
```

**Acceptance Criteria:**
- [ ] All tables created with correct constraints
- [ ] Indexes created for performance
- [ ] Trigger for updated_at on workers table
- [ ] Unique constraints enforced

---

### Task 1.2: Create Workers RLS Policies

**File:** `supabase/migrations/20250212000002_workers_rls.sql`

**Objective:** Apply Row Level Security policies to all workers tables.

**SQL Structure:**

```sql
-- ============================================================
-- Migration: Workers module - RLS policies
-- Module: 002-worker-module
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_equipment_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_software_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SOFTWARE policies
-- ============================================================

CREATE POLICY software_select_visible ON public.software
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT public.get_my_company_ids())
  );

CREATE POLICY software_insert_owner ON public.software
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

CREATE POLICY software_delete_owner ON public.software
  FOR DELETE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- EQUIPMENT BRANDS policies
-- ============================================================

CREATE POLICY equipment_brands_select_visible ON public.equipment_brands
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT public.get_my_company_ids())
  );

CREATE POLICY equipment_brands_insert_owner ON public.equipment_brands
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

CREATE POLICY equipment_brands_delete_owner ON public.equipment_brands
  FOR DELETE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- WORKERS policies
-- ============================================================

CREATE POLICY workers_select_member ON public.workers
  FOR SELECT USING (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY workers_insert_owner ON public.workers
  FOR INSERT WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY workers_update_owner ON public.workers
  FOR UPDATE USING (public.has_company_role(company_id, 'owner'))
  WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY workers_soft_delete_owner ON public.workers
  FOR DELETE USING (public.has_company_role(company_id, 'owner'))
  WITH CHECK (
    -- Instead of hard delete, set deleted_at
    public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- WORKER EQUIPMENT SKILLS policies (scoped via worker's company_id)
-- ============================================================

CREATE POLICY wes_select_member ON public.worker_equipment_skills
  FOR SELECT USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE company_id IN (SELECT public.get_my_company_ids())
    )
  );

CREATE POLICY wes_insert_owner ON public.worker_equipment_skills
  FOR INSERT WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY wes_update_owner ON public.worker_equipment_skills
  FOR UPDATE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  ) WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY wes_delete_owner ON public.worker_equipment_skills
  FOR DELETE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

-- ============================================================
-- WORKER SOFTWARE SKILLS policies (scoped via worker's company_id)
-- ============================================================

CREATE POLICY wss_select_member ON public.worker_software_skills
  FOR SELECT USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE company_id IN (SELECT public.get_my_company_ids())
    )
  );

CREATE POLICY wss_insert_owner ON public.worker_software_skills
  FOR INSERT WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY wss_delete_owner ON public.worker_software_skills
  FOR DELETE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );
```

**Acceptance Criteria:**
- [ ] RLS enabled on all tables
- [ ] Company scoping enforced via get_my_company_ids()
- [ ] Owner-only policies for INSERT/UPDATE/DELETE
- [ ] Member access for SELECT

---

### Task 1.3: Create Workers Seed Data

**File:** `supabase/migrations/20250212000003_workers_seed.sql`

**Objective:** Seed initial software data and default values.

**SQL Structure:**

```sql
-- ============================================================
-- Migration: Workers module - seed data
-- Module: 002-worker-module
-- ============================================================

-- Seed default software (company_id NULL = system defaults)
INSERT INTO public.software (id, company_id, name, is_seeded, created_at) VALUES
  (gen_random_uuid(), NULL, 'AutoCAD', true, now()),
  (gen_random_uuid(), NULL, 'Civil3D', true, now())
ON CONFLICT (name) WHERE company_id IS NULL DO NOTHING;

-- Seed default equipment brands (optional - can be empty)
-- Companies will add their own brands via quick-add
```

**Acceptance Criteria:**
- [ ] AutoCAD and Civil3D seeded as system software
- [ ] Seeded items marked with is_seeded = true

---

### Task 1.4: Create Database Views for API Queries

**File:** `supabase/migrations/20250212000004_workers_views.sql`

**Objective:** Create database views for common query patterns.

**SQL Structure:**

```sql
-- ============================================================
-- Migration: Workers module - views for API
-- Module: 002-worker-module
-- ============================================================

-- View: workers with equipment skills aggregated
CREATE OR REPLACE VIEW public.workers_with_equipment_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', wes.id,
      'equipment_type', wes.equipment_type,
      'equipment_brand', wes.equipment_brand,
      'proficiency_rating', wes.proficiency_rating
    ) ORDER BY wes.equipment_type, wes.equipment_brand
  ) FILTER (WHERE wes.id IS NOT NULL) AS equipment_skills
FROM public.workers w
LEFT JOIN public.worker_equipment_skills wes ON wes.worker_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id;

-- View: workers with software skills aggregated
CREATE OR REPLACE VIEW public.workers_with_software_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', wss.id,
      'software_id', wss.software_id,
      'software_name', s.name
    ) ORDER BY s.name
  ) FILTER (WHERE wss.id IS NOT NULL) AS software_skills
FROM public.workers w
LEFT JOIN public.worker_software_skills wss ON wss.worker_id = w.id
LEFT JOIN public.software s ON s.id = wss.software_id
WHERE w.deleted_at IS NULL
GROUP BY w.id;

-- View: workers with all skills
CREATE OR REPLACE VIEW public.workers_with_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', wes.id,
      'equipment_type', wes.equipment_type,
      'equipment_brand', wes.equipment_brand,
      'proficiency_rating', wes.proficiency_rating
    ) ORDER BY wes.equipment_type, wes.equipment_brand
  ) FILTER (WHERE wes.id IS NOT NULL) AS equipment_skills,
  jsonb_agg(
    jsonb_build_object(
      'id', wss.id,
      'software_id', wss.software_id,
      'software_name', s.name
    ) ORDER BY s.name
  ) FILTER (WHERE wss.id IS NOT NULL) AS software_skills
FROM public.workers w
LEFT JOIN public.worker_equipment_skills wes ON wes.worker_id = w.id
LEFT JOIN public.worker_software_skills wss ON wss.worker_id = w.id
LEFT JOIN public.software s ON s.id = wss.software_id
WHERE w.deleted_at IS NULL
GROUP BY w.id;
```

**Acceptance Criteria:**
- [ ] Views created successfully
- [ ] Views aggregate skills into JSON arrays
- [ ] Views exclude soft-deleted workers

---

### Task 1.5: Generate API Documentation

**Output File:** `planning/worker_module/api_schema.md`

This document describes the database schema for backend service developers.

**Template:**

```markdown
# Workers Module - API Schema Documentation

Generated from database migrations for backend service implementation.

## Tables

### workers
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| company_id | uuid | false | - | FK to companies |
| name | text | false | - | Worker full name |
| phone | text | false | - | Contact phone (unique per company) |
| category | worker_category | false | - | engineer | surveyor | assistant |
| salary_month | numeric(10,2) | false | - | Monthly salary |
| salary_day | numeric(10,2) | false | - | Daily salary |
| status | worker_status | false | 'active' | active | inactive |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Last update timestamp |
| deleted_at | timestamptz | true | - | Soft delete timestamp |

### software
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| company_id | uuid | true | - | FK to companies (NULL = system) |
| name | text | false | - | Software name |
| is_seeded | boolean | false | false | System seeded flag |
| created_at | timestamptz | false | now() | Creation timestamp |

### equipment_brands
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| company_id | uuid | true | - | FK to companies (NULL = system) |
| name | text | false | - | Brand name |
| created_at | timestamptz | false | now() | Creation timestamp |

### worker_equipment_skills
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| worker_id | uuid | false | - | FK to workers |
| equipment_type | text | false | - | Equipment type name |
| equipment_brand | text | false | - | Equipment brand name |
| proficiency_rating | integer | false | - | 1-5 rating |
| created_at | timestamptz | false | now() | Creation timestamp |

### worker_software_skills
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| worker_id | uuid | false | - | FK to workers |
| software_id | uuid | false | - | FK to software |
| created_at | timestamptz | false | now() | Creation timestamp |

## Enums

### worker_category
- `engineer`
- `surveyor`
- `assistant`

### worker_status
- `active`
- `inactive`

## Views

### workers_with_skills
Returns workers with equipment and software skills aggregated as JSONB arrays.
```

**Acceptance Criteria:**
- [ ] All tables documented with columns
- [ ] Enums documented
- [ ] Views documented
- [ ] Ready for backend service implementation

---

## Part 2: Backend Services

### Task 2.1: Add Worker Types to @repo/types

**File:** `packages/types/src/index.ts`

**Objective:** Define TypeScript interfaces for all worker-related entities.

**Types to Add:**

```typescript
// ============================================================
// Workers Module: DB row types
// ============================================================

export type WorkerCategory = "engineer" | "surveyor" | "assistant";
export type WorkerStatus = "active" | "inactive";
export type ProficiencyRating = 1 | 2 | 3 | 4 | 5;

export interface Worker {
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

export interface Software {
  id: string;
  company_id: string | null;
  name: string;
  is_seeded: boolean;
  created_at: string;
}

export interface EquipmentBrand {
  id: string;
  company_id: string | null;
  name: string;
  created_at: string;
}

export interface WorkerEquipmentSkill {
  id: string;
  worker_id: string;
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
  created_at: string;
}

export interface WorkerSoftwareSkill {
  id: string;
  worker_id: string;
  software_id: string;
  created_at: string;
}

// ============================================================
// Workers Module: Composite / joined types
// ============================================================

export interface WorkerWithSkills extends Worker {
  equipment_skills?: WorkerEquipmentSkill[];
  software_skills?: (WorkerSoftwareSkill & { software: Software })[];
}

export interface WorkerWithEquipmentSkills extends Worker {
  equipment_skills: WorkerEquipmentSkill[];
}

export interface WorkerWithSoftwareSkills extends Worker {
  software_skills: (WorkerSoftwareSkill & { software_name: string })[];
}

// ============================================================
// Workers Module: DTOs / payloads
// ============================================================

export interface CreateWorkerPayload {
  name: string;
  phone: string;
  category: WorkerCategory;
  salary_month: number;
  salary_day: number;
  equipment_skills?: Array<{
    equipment_type: string;
    equipment_brand: string;
    proficiency_rating: ProficiencyRating;
  }>;
  software_skill_ids?: string[];
}

export interface UpdateWorkerPayload {
  name?: string;
  phone?: string;
  category?: WorkerCategory;
  salary_month?: number;
  salary_day?: number;
  status?: WorkerStatus;
}

export interface AddWorkerEquipmentSkillPayload {
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
}

export interface UpdateWorkerEquipmentSkillPayload {
  proficiency_rating: ProficiencyRating;
}

export interface CreateSoftwarePayload {
  name: string;
}

export interface CreateEquipmentBrandPayload {
  name: string;
}
```

**Acceptance Criteria:**
- [ ] All types added to `packages/types/src/index.ts`
- [ ] Types exported in main index
- [ ] Zod-compatible structure

---

### Task 2.2: Create Worker Zod Schemas

**File:** `packages/api-client/src/schemas/worker.ts`

**Objective:** Define validation schemas for all worker payloads.

**Schema Structure:**

```typescript
// ---------------------------------------------------------------------------
// Zod schemas — worker payloads
// ---------------------------------------------------------------------------

import { z } from "zod";

export const createWorkerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    phone: z.string().min(1, "Phone is required"),
    category: z.enum(["engineer", "surveyor", "assistant"]),
    salary_month: z.coerce.number().nonnegative("Must be non-negative"),
    salary_day: z.coerce.number().nonnegative("Must be non-negative"),
    equipment_skills: z.array(
      z.object({
        equipment_type: z.string().min(1, "Equipment type is required"),
        equipment_brand: z.string().min(1, "Equipment brand is required"),
        proficiency_rating: z.number().int().min(1).max(5),
      })
    ).optional(),
    software_skill_ids: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.salary_month > 0 || data.salary_day > 0, {
    message: "At least one salary must be greater than 0",
  });

export const updateWorkerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).optional(),
  category: z.enum(["engineer", "surveyor", "assistant"]).optional(),
  salary_month: z.coerce.number().nonnegative().optional(),
  salary_day: z.coerce.number().nonnegative().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const addWorkerEquipmentSkillSchema = z.object({
  equipment_type: z.string().min(1, "Equipment type is required"),
  equipment_brand: z.string().min(1, "Equipment brand is required"),
  proficiency_rating: z.number().int().min(1).max(5),
});

export const createSoftwareSchema = z.object({
  name: z.string().min(1, "Software name is required").max(100),
});

export const createEquipmentBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
});

export type CreateWorkerFormData = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerFormData = z.infer<typeof updateWorkerSchema>;
export type AddWorkerEquipmentSkillFormData = z.infer<typeof addWorkerEquipmentSkillSchema>;
export type CreateSoftwareFormData = z.infer<typeof createSoftwareSchema>;
export type CreateEquipmentBrandFormData = z.infer<typeof createEquipmentBrandSchema>;
```

**Acceptance Criteria:**
- [ ] All schemas created
- [ ] Validation rules match PRD requirements
- [ ] Types exported for form usage

---

### Task 2.3: Create Worker Service

**File:** `packages/api-client/src/services/worker.ts`

**Objective:** Implement all worker CRUD operations and skill management.

**Service Structure:**

```typescript
// ---------------------------------------------------------------------------
// workerService — workers CRUD + skill management + master data
// ---------------------------------------------------------------------------

import type {
  Result,
  Worker,
  WorkerWithSkills,
  WorkerEquipmentSkill,
  WorkerSoftwareSkill,
  CreateWorkerPayload,
  UpdateWorkerPayload,
  AddWorkerEquipmentSkillPayload,
  Software,
  EquipmentBrand,
  CreateSoftwarePayload,
  CreateEquipmentBrandPayload,
} from "@repo/types";
import { getSupabase } from "../client";
import { createWorkerSchema, updateWorkerSchema, addWorkerEquipmentSkillSchema, createSoftwareSchema, createEquipmentBrandSchema } from "../schemas/worker";
import { mapSupabaseError, mapUnknownError, ok, fail } from "../lib/errors";

export const workerService = {
  // ---- Worker CRUD -------------------------------------------------------

  async list(
    companyId: string,
    filters?: {
      status?: "active" | "inactive";
      category?: "engineer" | "surveyor" | "assistant";
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Worker[]>> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("workers")
        .select("id, company_id, name, phone, category, salary_month, salary_day, status, created_at, updated_at")
        .eq("company_id", companyId)
        .is("deleted_at", null) // Exclude soft-deleted
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getById(workerId: string): Promise<Result<WorkerWithSkills>> {
    try {
      const supabase = getSupabase();

      // Get worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("id, company_id, name, phone, category, salary_month, salary_day, status, created_at, updated_at")
        .eq("id", workerId)
        .is("deleted_at", null)
        .single();

      if (workerError) return fail(mapSupabaseError(workerError));

      // Get equipment skills
      const { data: equipmentSkills, error: eqError } = await supabase
        .from("worker_equipment_skills")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      // Get software skills
      const { data: softwareSkills, error: swError } = await supabase
        .from("worker_software_skills")
        .select(`
          id, worker_id, software_id, created_at,
          software:software (id, name, is_seeded, created_at)
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      return ok({
        ...worker,
        equipment_skills: equipmentSkills ?? [],
        software_skills: (softwareSkills ?? []).map(s => ({
          ...s,
          software: (s as any).software,
        })),
      } as WorkerWithSkills);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async create(companyId: string, payload: CreateWorkerPayload): Promise<Result<Worker>> {
    try {
      const parsed = createWorkerSchema.parse(payload);
      const supabase = getSupabase();

      // Create worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .insert({
          company_id: companyId,
          name: parsed.name,
          phone: parsed.phone,
          category: parsed.category,
          salary_month: parsed.salary_month,
          salary_day: parsed.salary_day,
        })
        .select()
        .single();

      if (workerError) return fail(mapSupabaseError(workerError));

      // Add equipment skills if provided
      if (parsed.equipment_skills && parsed.equipment_skills.length > 0) {
        const skillsToInsert = parsed.equipment_skills.map(skill => ({
          worker_id: worker.id,
          equipment_type: skill.equipment_type,
          equipment_brand: skill.equipment_brand,
          proficiency_rating: skill.proficiency_rating,
        }));

        const { error: skillsError } = await supabase
          .from("worker_equipment_skills")
          .insert(skillsToInsert);

        if (skillsError) return fail(mapSupabaseError(skillsError));
      }

      // Add software skills if provided
      if (parsed.software_skill_ids && parsed.software_skill_ids.length > 0) {
        const skillsToInsert = parsed.software_skill_ids.map(softwareId => ({
          worker_id: worker.id,
          software_id: softwareId,
        }));

        const { error: swError } = await supabase
          .from("worker_software_skills")
          .insert(skillsToInsert);

        if (swError) return fail(mapSupabaseError(swError));
      }

      return ok(worker as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async update(workerId: string, payload: UpdateWorkerPayload): Promise<Result<Worker>> {
    try {
      const parsed = updateWorkerSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("workers")
        .update(parsed)
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async archive(workerId: string): Promise<Result<Worker>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("workers")
        .update({ status: "inactive" })
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async reactivate(workerId: string): Promise<Result<Worker>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("workers")
        .update({ status: "active" })
        .eq("id", workerId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Worker);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Skills --------------------------------------------------

  async getEquipmentSkills(workerId: string): Promise<Result<WorkerEquipmentSkill[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async addEquipmentSkill(
    workerId: string,
    payload: AddWorkerEquipmentSkillPayload
  ): Promise<Result<WorkerEquipmentSkill>> {
    try {
      const parsed = addWorkerEquipmentSkillSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .insert({
          worker_id: workerId,
          equipment_type: parsed.equipment_type,
          equipment_brand: parsed.equipment_brand,
          proficiency_rating: parsed.proficiency_rating,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async updateEquipmentSkill(
    skillId: string,
    rating: ProficiencyRating
  ): Promise<Result<WorkerEquipmentSkill>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_equipment_skills")
        .update({ proficiency_rating: rating })
        .eq("id", skillId)
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerEquipmentSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async removeEquipmentSkill(skillId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("worker_equipment_skills")
        .delete()
        .eq("id", skillId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Software Skills ---------------------------------------------------

  async getSoftwareSkills(workerId: string): Promise<Result<(WorkerSoftwareSkill & { software: Software })[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_software_skills")
        .select(`
          id, worker_id, software_id, created_at,
          software:software (id, name, is_seeded, created_at)
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as unknown as (WorkerSoftwareSkill & { software: Software })[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async addSoftwareSkill(workerId: string, softwareId: string): Promise<Result<WorkerSoftwareSkill>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("worker_software_skills")
        .insert({
          worker_id: workerId,
          software_id: softwareId,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as WorkerSoftwareSkill);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async removeSoftwareSkill(skillId: string): Promise<Result<void>> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("worker_software_skills")
        .delete()
        .eq("id", skillId);

      if (error) return fail(mapSupabaseError(error));
      return ok(undefined as void);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Master Data (Software & Equipment Brands) -------------------------

  async getSoftwareList(companyId: string): Promise<Result<Software[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("software")
        .select("id, company_id, name, is_seeded, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Software[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createSoftware(companyId: string, payload: CreateSoftwarePayload): Promise<Result<Software>> {
    try {
      const parsed = createSoftwareSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("software")
        .insert({
          company_id: companyId,
          name: parsed.name,
          is_seeded: false,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as Software);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async getEquipmentBrands(companyId: string): Promise<Result<EquipmentBrand[]>> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_brands")
        .select("id, company_id, name, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentBrand[]);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  async createEquipmentBrand(companyId: string, payload: CreateEquipmentBrandPayload): Promise<Result<EquipmentBrand>> {
    try {
      const parsed = createEquipmentBrandSchema.parse(payload);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("equipment_brands")
        .insert({
          company_id: companyId,
          name: parsed.name,
        })
        .select()
        .single();

      if (error) return fail(mapSupabaseError(error));
      return ok(data as EquipmentBrand);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },

  // ---- Equipment Types (reusing from equipment module) -------------------

  async getEquipmentTypes(companyId: string): Promise<Result<any[]>> {
    // Reuse equipment_types from equipment module
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("equipment_types")
        .select("id, company_id, name, created_at")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .order("name", { ascending: true });

      if (error) return fail(mapSupabaseError(error));
      return ok(data ?? []);
    } catch (err) {
      return fail(mapUnknownError(err));
    }
  },
};
```

**Acceptance Criteria:**
- [ ] All CRUD operations implemented
- [ ] Skill management operations implemented
- [ ] Master data operations implemented
- [ ] Error handling with Result type

---

### Task 2.4: Create Worker Hooks

**File:** `packages/api-client/src/hooks/use-worker.ts`

**Objective:** Create React Query hooks for all worker operations.

**Hook Structure:**

```typescript
// ---------------------------------------------------------------------------
// Worker hooks — list, detail, CRUD mutations, skills, master data
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateWorkerPayload,
  UpdateWorkerPayload,
  AddWorkerEquipmentSkillPayload,
  CreateSoftwarePayload,
  CreateEquipmentBrandPayload,
} from "@repo/types";
import { workerService } from "../services/worker";
import { queryKeys } from "../lib/query-keys";

// Add to queryKeys factory
queryKeys.workers = {
  all: (companyId: string) => ["workers", companyId] as const,
  detail: (id: string) => ["workers", id] as const,
  equipmentSkills: (workerId: string) => ["workers", workerId, "equipment-skills"] as const,
  softwareSkills: (workerId: string) => ["workers", workerId, "software-skills"] as const,
  software: (companyId: string) => ["software", companyId] as const,
  equipmentBrands: (companyId: string) => ["equipment-brands", companyId] as const,
  equipmentTypes: (companyId: string) => ["equipment-types", companyId] as const,
};

export function useWorkerList(
  companyId: string | undefined,
  filters?: {
    status?: "active" | "inactive";
    category?: "engineer" | "surveyor" | "assistant";
    search?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.workers.all(companyId!), filters],
    queryFn: () => workerService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useWorkerDetail(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.detail(workerId!),
    queryFn: () => workerService.getById(workerId!),
    enabled: !!workerId,
  });
}

export function useCreateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateWorkerPayload }) =>
      workerService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(companyId) });
      }
    },
  });
}

export function useUpdateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, payload }: { workerId: string; payload: UpdateWorkerPayload }) =>
      workerService.update(workerId, payload),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

export function useArchiveWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => workerService.archive(workerId),
    onSuccess: (result, workerId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

export function useReactivateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => workerService.reactivate(workerId),
    onSuccess: (result, workerId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

// ---- Equipment Skills Hooks ------------------------------------------------

export function useWorkerEquipmentSkills(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentSkills(workerId!),
    queryFn: () => workerService.getEquipmentSkills(workerId!),
    enabled: !!workerId,
  });
}

export function useAddWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, payload }: { workerId: string; payload: AddWorkerEquipmentSkillPayload }) =>
      workerService.addEquipmentSkill(workerId, payload),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
      }
    },
  });
}

export function useUpdateWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, rating }: { skillId: string; workerId: string; rating: number }) =>
      workerService.updateEquipmentSkill(skillId, rating),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
      }
    },
  });
}

export function useRemoveWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, workerId }: { skillId: string; workerId: string }) =>
      workerService.removeEquipmentSkill(skillId),
    onSuccess: (_result, { workerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
    },
  });
}

// ---- Software Skills Hooks -------------------------------------------------

export function useWorkerSoftwareSkills(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.softwareSkills(workerId!),
    queryFn: () => workerService.getSoftwareSkills(workerId!),
    enabled: !!workerId,
  });
}

export function useAddWorkerSoftwareSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, softwareId }: { workerId: string; softwareId: string }) =>
      workerService.addSoftwareSkill(workerId, softwareId),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.softwareSkills(workerId) });
      }
    },
  });
}

export function useRemoveWorkerSoftwareSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, workerId }: { skillId: string; workerId: string }) =>
      workerService.removeSoftwareSkill(skillId),
    onSuccess: (_result, { workerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.softwareSkills(workerId) });
    },
  });
}

// ---- Master Data Hooks -----------------------------------------------------

export function useSoftwareList(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.software(companyId!),
    queryFn: () => workerService.getSoftwareList(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateSoftwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateSoftwarePayload }) =>
      workerService.createSoftware(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.software(companyId) });
      }
    },
  });
}

export function useEquipmentBrands(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentBrands(companyId!),
    queryFn: () => workerService.getEquipmentBrands(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateEquipmentBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateEquipmentBrandPayload }) =>
      workerService.createEquipmentBrand(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentBrands(companyId) });
      }
    },
  });
}

export function useEquipmentTypesList(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentTypes(companyId!),
    queryFn: () => workerService.getEquipmentTypes(companyId!),
    enabled: !!companyId,
  });
}
```

**Acceptance Criteria:**
- [ ] All hooks created matching service methods
- [ ] Query key factory updated
- [ ] Proper cache invalidation

---

### Task 2.5: Update Error Mapping

**File:** `packages/api-client/src/lib/errors.ts`

**Objective:** Add worker-specific error messages.

**Add to `mapUniqueConstraintMessage` function:**

```typescript
function mapUniqueConstraintMessage(message: string, details?: string): string {
  const combined = `${message} ${details ?? ""}`.toLowerCase();

  if (combined.includes("serial_number"))
    return "An equipment record with this serial number already exists.";
  if (combined.includes("suppliers") && combined.includes("name"))
    return "A supplier with this name already exists.";
  if (combined.includes("partners") && combined.includes("name"))
    return "A partner with this name already exists.";
  // NEW: Workers
  if (combined.includes("workers") && combined.includes("phone"))
    return "A worker with this phone number already exists.";
  if (combined.includes("software") && combined.includes("name"))
    return "Software with this name already exists.";
  if (combined.includes("equipment_brands") && combined.includes("name"))
    return "An equipment brand with this name already exists.";
  if (combined.includes("worker_equipment_skills") && combined.includes("worker_id"))
    return "This equipment skill already exists for the worker.";
  if (combined.includes("worker_software_skills") && combined.includes("worker_id"))
    return "This software skill is already assigned to the worker.";

  return "A record with these details already exists.";
}
```

**Acceptance Criteria:**
- [ ] Worker-specific error messages added
- [ ] Error messages are user-friendly

---

### Task 2.6: Update API Client Index

**File:** `packages/api-client/src/index.ts`

**Objective:** Export all worker-related hooks and types.

**Add exports:**

```typescript
// Worker exports
export * from "./services/worker";
export * from "./hooks/use-worker";
export * from "./schemas/worker";
```

**Acceptance Criteria:**
- [ ] All worker exports added
- [ ] Package index updated

---

### Task 2.7: Generate Service Documentation

**Output File:** `planning/worker_module/service_interface.md`

This document describes the available services for frontend developers.

**Template:**

```markdown
# Workers Module - Service Interface Documentation

Generated from backend services for frontend implementation.

## Service: workerService

### Worker CRUD

#### `list(companyId, filters?)`
Returns a paginated list of workers for the company.

**Parameters:**
- `companyId: string` - Company ID
- `filters?: {
    status?: "active" | "inactive",
    category?: "engineer" | "surveyor" | "assistant",
    search?: string,
    limit?: number,
    offset?: number
  }`

**Returns:** `Result<Worker[]>`

#### `getById(workerId)`
Returns worker with all skills.

**Parameters:**
- `workerId: string`

**Returns:** `Result<WorkerWithSkills>`

#### `create(companyId, payload)`
Creates a new worker with optional skills.

**Parameters:**
- `companyId: string`
- `payload: CreateWorkerPayload`

**Returns:** `Result<Worker>`

#### `update(workerId, payload)`
Updates worker details.

**Parameters:**
- `workerId: string`
- `payload: UpdateWorkerPayload`

**Returns:** `Result<Worker>`

#### `archive(workerId)`
Sets worker status to inactive.

**Parameters:**
- `workerId: string`

**Returns:** `Result<Worker>`

#### `reactivate(workerId)`
Sets worker status to active.

**Parameters:**
- `workerId: string`

**Returns:** `Result<Worker>`

### Equipment Skills

#### `getEquipmentSkills(workerId)`
Returns all equipment skills for a worker.

**Returns:** `Result<WorkerEquipmentSkill[]>`

#### `addEquipmentSkill(workerId, payload)`
Adds an equipment skill with rating.

**Parameters:**
- `payload: {
    equipment_type: string,
    equipment_brand: string,
    proficiency_rating: 1-5
  }`

**Returns:** `Result<WorkerEquipmentSkill>`

#### `updateEquipmentSkill(skillId, rating)`
Updates the proficiency rating.

**Parameters:**
- `skillId: string`
- `rating: 1-5`

**Returns:** `Result<WorkerEquipmentSkill>`

#### `removeEquipmentSkill(skillId)`
Removes an equipment skill.

**Parameters:**
- `skillId: string`

**Returns:** `Result<void>`

### Software Skills

#### `getSoftwareSkills(workerId)`
Returns all software skills for a worker.

**Returns:** `Result<(WorkerSoftwareSkill & { software: Software })[]>`

#### `addSoftwareSkill(workerId, softwareId)`
Adds a software skill.

**Parameters:**
- `softwareId: string`

**Returns:** `Result<WorkerSoftwareSkill>`

#### `removeSoftwareSkill(skillId)`
Removes a software skill.

**Parameters:**
- `skillId: string`

**Returns:** `Result<void>`

### Master Data

#### `getSoftwareList(companyId)`
Returns all software (system + company).

**Returns:** `Result<Software[]>`

#### `createSoftware(companyId, payload)`
Creates new software (quick-add).

**Parameters:**
- `payload: { name: string }`

**Returns:** `Result<Software>`

#### `getEquipmentBrands(companyId)`
Returns all equipment brands (system + company).

**Returns:** `Result<EquipmentBrand[]>`

#### `createEquipmentBrand(companyId, payload)`
Creates new equipment brand (quick-add).

**Parameters:**
- `payload: { name: string }`

**Returns:** `Result<EquipmentBrand>`

#### `getEquipmentTypes(companyId)`
Returns all equipment types (reused from equipment module).

**Returns:** `Result<EquipmentType[]>`

## React Query Hooks

All service methods have corresponding hooks:
- `useWorkerList(companyId, filters?)`
- `useWorkerDetail(workerId)`
- `useCreateWorkerMutation()`
- `useUpdateWorkerMutation()`
- `useArchiveWorkerMutation()`
- `useReactivateWorkerMutation()`
- `useWorkerEquipmentSkills(workerId)`
- `useAddWorkerEquipmentSkillMutation()`
- `useUpdateWorkerEquipmentSkillMutation()`
- `useRemoveWorkerEquipmentSkillMutation()`
- `useWorkerSoftwareSkills(workerId)`
- `useAddWorkerSoftwareSkillMutation()`
- `useRemoveWorkerSoftwareSkillMutation()`
- `useSoftwareList(companyId)`
- `useCreateSoftwareMutation()`
- `useEquipmentBrands(companyId)`
- `useCreateEquipmentBrandMutation()`
- `useEquipmentTypesList(companyId)`
```

**Acceptance Criteria:**
- [ ] All services documented
- [ ] All hooks documented
- [ ] Ready for frontend implementation

---

## Part 3: Web App

### Task 3.1: Create Quick-Add Select Component

**File:** `apps/web/src/components/ui/quick-add-select.tsx`

**Objective:** Create generic reusable quick-add component.

**Component Structure:**

```typescript
import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface QuickAddSelectProps {
  entity: "software" | "equipment-brand" | "equipment-type";
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  companyId?: string;
  onCreate: (name: string) => Promise<{ data?: { id: string; name: string }; error?: any }>;
  options: Array<{ id: string; name: string }>;
}

export function QuickAddSelect({
  entity,
  value,
  onChange,
  placeholder = `Select or type to add ${entity}...`,
  disabled = false,
  onCreate,
  options,
}: QuickAddSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.name === value);
  const exactMatch = options.find((opt) => opt.name.toLowerCase() === inputValue.toLowerCase());

  const filteredOptions = inputValue
    ? options.filter((opt) => opt.name.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  async function handleCreateNew() {
    if (!inputValue.trim()) return;

    setIsCreating(true);
    const result = await onCreate(inputValue.trim());
    setIsCreating(false);

    if (result.data) {
      onChange(result.data.name);
      setInputValue("");
      setOpen(false);
    }
  }

  function handleSelect(optionName: string) {
    onChange(optionName);
    setInputValue("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && inputValue.trim() && !exactMatch) {
      e.preventDefault();
      handleCreateNew();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {value ? value : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={`Search or add ${entity}...`}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>
                {inputValue.trim() ? (
                  <div className="flex items-center justify-between py-2 px-2">
                    <span className="text-sm">Press Enter to add "{inputValue}"</span>
                    <Plus className="h-4 w-4" />
                  </div>
                ) : (
                  `No ${entity} found.`
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => handleSelect(option.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Acceptance Criteria:**
- [ ] Generic component accepting entity type
- [ ] Shows filtered options
- [ ] Enter key creates new option
- [ ] Visual feedback for new item creation

---

### Task 3.2: Create Worker Form Component

**File:** `apps/web/src/components/workers/worker-form.tsx`

**Objective:** Create form component for creating/editing workers.

**Component Structure:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Star } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWorkerSchema, type CreateWorkerFormData } from "@repo/api-client";
import { QuickAddSelect } from "@/components/ui/quick-add-select";

interface WorkerFormProps {
  companyId: string;
  defaultValues?: CreateWorkerFormData;
  onSubmit: (data: CreateWorkerFormData) => void | Promise<void>;
  isPending?: boolean;
}

export function WorkerForm({ companyId, defaultValues, onSubmit, isPending }: WorkerFormProps) {
  const form = useForm<CreateWorkerFormData>({
    resolver: zodResolver(createWorkerSchema),
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      category: "assistant",
      salary_month: 0,
      salary_day: 0,
      equipment_skills: [],
      software_skill_ids: [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Worker name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="surveyor">Surveyor</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salary_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Salary</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Salary</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Equipment Skills Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Equipment Skills</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues("equipment_skills") || [];
                form.setValue("equipment_skills", [
                  ...current,
                  { equipment_type: "", equipment_brand: "", proficiency_rating: 3 },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
          </div>

          {form.watch("equipment_skills")?.map((_, index) => (
            <div key={index} className="flex items-end gap-2 p-4 border rounded-lg">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Equipment Type</label>
                <EquipmentTypeSelect
                  companyId={companyId}
                  value={form.watch(`equipment_skills.${index}.equipment_type`)}
                  onChange={(val) => form.setValue(`equipment_skills.${index}.equipment_type` as const, val)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Brand</label>
                <EquipmentBrandSelect
                  companyId={companyId}
                  value={form.watch(`equipment_skills.${index}.equipment_brand`)}
                  onChange={(val) => form.setValue(`equipment_skills.${index}.equipment_brand` as const, val)}
                />
              </div>
              <div className="w-32">
                <label className="text-xs text-muted-foreground">Proficiency</label>
                <StarRating
                  value={form.watch(`equipment_skills.${index}.proficiency_rating`)}
                  onChange={(val) => form.setValue(`equipment_skills.${index}.proficiency_rating` as const, val)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const current = form.getValues("equipment_skills") || [];
                  form.setValue("equipment_skills", current.filter((_, i) => i !== index));
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Software Skills Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Software Skills</h3>
          <SoftwareMultiSelect
            companyId={companyId}
            value={form.watch("software_skill_ids") || []}
            onChange={(ids) => form.setValue("software_skill_ids", ids)}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving..." : defaultValues ? "Update Worker" : "Create Worker"}
        </Button>
      </form>
    </Form>
  );
}

// Helper components for the form
function EquipmentTypeSelect({ value, onChange, companyId }: { value?: string; onChange: (val: string) => void; companyId: string }) {
  // Use equipment types from equipment module
  // Implementation uses useEquipmentTypesList hook
  return <QuickAddSelect entity="equipment-type" value={value} onChange={onChange} options={[]} />;
}

function EquipmentBrandSelect({ value, onChange, companyId }: { value?: string; onChange: (val: string) => void; companyId: string }) {
  // Implementation uses useEquipmentBrands hook
  return <QuickAddSelect entity="equipment-brand" value={value} onChange={onChange} options={[]} />;
}

function StarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "h-5 w-5",
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function SoftwareMultiSelect({ value, onChange, companyId }: { value: string[]; onChange: (ids: string[]) => void; companyId: string }) {
  // Implementation uses useSoftwareList hook with multi-select
  return <div>Software multi-select component</div>;
}
```

**Acceptance Criteria:**
- [ ] Form validates with Zod schema
- [ ] Equipment skills can be added/removed
- [ ] Star rating component for proficiency
- [ ] Software multi-select
- [ ] Quick-add for new items

---

### Task 3.3: Create Worker List Page

**File:** `apps/web/src/pages/workers/list.tsx`

**Objective:** Create paginated list page with search and filters.

**Component Structure:**

```typescript
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWorkerList, useMyCompanies } from "@repo/api-client";
import { Plus, Search, LayoutGrid, List, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Worker } from "@repo/types";

export default function WorkerListPage() {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: listResult, isLoading } = useWorkerList(
    companyId,
    showInactive ? undefined : { status: "active" }
  );

  const workers = listResult?.data ?? [];
  const error = listResult?.error;

  const filtered = useMemo(() => {
    let items = workers;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      items = items.filter((w) => w.category === categoryFilter);
    }
    return items;
  }, [workers, search, categoryFilter]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Workers</h1>
        <Link to="/workers/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Add Worker
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          <option value="engineer">Engineers</option>
          <option value="surveyor">Surveyors</option>
          <option value="assistant">Assistants</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        viewMode === "card" ? <WorkerCardGridSkeleton /> : <WorkerTableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState workers={workers} />
      ) : viewMode === "card" ? (
        <WorkerCardGrid workers={filtered} />
      ) : (
        <WorkerTable workers={filtered} />
      )}
    </div>
  );
}

function WorkerCardGrid({ workers }: { workers: Worker[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workers.map((worker) => (
        <Link key={worker.id} to={`/workers/${worker.id}`}>
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{worker.name}</h3>
                  <p className="text-sm text-muted-foreground">{worker.phone}</p>
                </div>
              </div>
              <WorkerCategoryBadge category={worker.category} />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily</span>
                <span className="font-medium">${worker.salary_day.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly</span>
                <span className="font-medium">${worker.salary_month.toFixed(2)}</span>
              </div>
            </div>
            <WorkerStatusBadge status={worker.status} className="mt-3" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function WorkerTable({ workers }: { workers: Worker[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Daily Salary</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker) => (
            <tr key={worker.id} className="border-b transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  to={`/workers/${worker.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {worker.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{worker.phone}</td>
              <td className="px-4 py-3">
                <WorkerCategoryBadge category={worker.category} />
              </td>
              <td className="px-4 py-3">${worker.salary_day.toFixed(2)}</td>
              <td className="px-4 py-3">
                <WorkerStatusBadge status={worker.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkerCategoryBadge({ category }: { category: string }) {
  const colors = {
    engineer: "bg-blue-100 text-blue-700",
    surveyor: "bg-green-100 text-green-700",
    assistant: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colors[category as keyof typeof colors])}>
      {category}
    </span>
  );
}

function WorkerStatusBadge({ status, className }: { status: string; className?: string }) {
  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colors[status as keyof typeof colors], className)}>
      {status}
    </span>
  );
}

function EmptyState({ workers }: { workers: Worker[] }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <User className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="mb-2 text-lg font-medium text-muted-foreground">
        {workers.length === 0 ? "No workers yet" : "No matching workers"}
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        {workers.length === 0 ? "Get started by adding your first worker." : "Try adjusting your search or filters."}
      </p>
      {workers.length === 0 && (
        <Link to="/workers/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Add your first worker
        </Link>
      )}
    </div>
  );
}

function WorkerCardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function WorkerTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Daily Salary</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] List displays workers with pagination
- [ ] Search by name/phone
- [ ] Filter by category
- [ ] Card and table view modes
- [ ] Loading skeletons

---

### Task 3.4: Create Worker Form Page

**File:** `apps/web/src/pages/workers/form.tsx`

**Objective:** Create page for creating/editing workers.

**Component Structure:**

```typescript
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useWorkerDetail,
  useCreateWorkerMutation,
  useMyCompanies,
  type CreateWorkerFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkerForm from "@/components/workers/worker-form";

export default function WorkerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useWorkerDetail(
    isEdit ? id : undefined
  );

  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(data: CreateWorkerFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({
        workerId: id,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/workers/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({
        companyId,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/workers/${result.data!.id}`);
    }
  }

  if (isEdit && detailLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={isEdit ? `/workers/${id}` : "/workers"}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Worker" : "New Worker"}
        </h1>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Update worker details" : "Add a new worker"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          {companyId && (
            <WorkerForm
              companyId={companyId}
              defaultValues={isEdit ? (detailResult?.data ?? undefined) : undefined}
              onSubmit={handleSubmit}
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Create mode shows empty form
- [ ] Edit mode pre-fills with existing data
- [ ] Navigation after save

---

### Task 3.5: Create Worker Detail Page

**File:** `apps/web/src/pages/workers/detail.tsx`

**Objective:** Create page showing worker details with skills.

**Component Structure:**

```typescript
import { useParams, Link, useNavigate } from "react-router-dom";
import { useWorkerDetail, useArchiveWorkerMutation, useReactivateWorkerMutation } from "@repo/api-client";
import { ArrowLeft, Edit, Archive, RotateCcw, User, Phone, Star, Monitor, Wrench } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkerWithSkills } from "@repo/types";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: detailResult, isLoading } = useWorkerDetail(id);
  const worker = detailResult?.data;

  const archiveMutation = useArchiveWorkerMutation();
  const reactivateMutation = useReactivateWorkerMutation();

  async function handleArchive() {
    if (!id) return;
    await archiveMutation.mutateAsync(id);
  }

  async function handleReactivate() {
    if (!id) return;
    await reactivateMutation.mutateAsync(id);
  }

  if (isLoading) {
    return <WorkerDetailSkeleton />;
  }

  if (!worker) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Worker not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/workers" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{worker.name}</h1>
            <p className="text-sm text-muted-foreground">{worker.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/workers/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {worker.status === "active" ? (
            <Button variant="destructive" onClick={handleArchive} disabled={archiveMutation.isPending}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReactivate} disabled={reactivateMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </dt>
                  <dd className="font-medium">{worker.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </dt>
                  <dd className="font-medium">{worker.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd>
                    <WorkerCategoryBadge category={worker.category} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd>
                    <WorkerStatusBadge status={worker.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Monthly Salary</dt>
                  <dd className="font-medium">${worker.salary_month.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Daily Salary</dt>
                  <dd className="font-medium">${worker.salary_day.toFixed(2)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Equipment Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worker.equipment_skills && worker.equipment_skills.length > 0 ? (
                <div className="space-y-3">
                  {worker.equipment_skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{skill.equipment_type}</p>
                        <p className="text-sm text-muted-foreground">{skill.equipment_brand}</p>
                      </div>
                      <StarRating value={skill.proficiency_rating} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No equipment skills recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Software Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Software Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worker.software_skills && worker.software_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {worker.software_skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.software.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No software skills recorded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment Skills</span>
                <span className="font-medium">{worker.equipment_skills?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Software Skills</span>
                <span className="font-medium">{worker.software_skills?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Rate</span>
                <span className="font-medium">${worker.salary_day.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WorkerCategoryBadge({ category }: { category: string }) {
  const colors = {
    engineer: "bg-blue-100 text-blue-700",
    surveyor: "bg-green-100 text-green-700",
    assistant: "bg-gray-100 text-gray-700",
  };
  return (
    <Badge className={cn(colors[category as keyof typeof colors])}>
      {category}
    </Badge>
  );
}

function WorkerStatusBadge({ status }: { status: string }) {
  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge className={cn(colors[status as keyof typeof colors])}>
      {status}
    </Badge>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

function WorkerDetailSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all worker details
- [ ] Shows equipment skills with ratings
- [ ] Shows software skills
- [ ] Archive/Reactivate buttons

---

### Task 3.6: Update Web Router

**File:** `apps/web/src/pages/__root.tsx` or router config

**Objective:** Add worker routes.

**Routes to Add:**

```typescript
// In your router configuration
{
  path: "/workers",
  children: [
    { index: true, element: <WorkerListPage /> },
    { path: "new", element: <WorkerFormPage /> },
    { path: ":id", element: <WorkerDetailPage /> },
    { path: ":id/edit", element: <WorkerFormPage /> },
  ],
}
```

**Acceptance Criteria:**
- [ ] All worker routes added
- [ ] Navigation works

---

### Task 3.7: Add Workers to Navigation

**File:** Navigation component (e.g., `apps/web/src/components/layout/sidebar.tsx`)

**Objective:** Add Workers link to main navigation.

**Add Navigation Item:**

```typescript
{
  title: "Workers",
  href: "/workers",
  icon: User, // or similar icon
}
```

**Acceptance Criteria:**
- [ ] Workers link visible in navigation
- [ ] Active state works

---

## Part 4: Mobile App

### Task 4.1: Create Mobile Worker List Screen

**File:** `apps/mobile/app/workers/index.tsx` or similar

**Objective:** Create mobile worker list with search.

**Component Structure:**

```typescript
import { useState, useMemo } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useWorkerList, useMyCompanies } from "@repo/api-client";
import { Search, Plus, User, Filter } from "@/components/icons";
import { WorkerCategoryBadge, WorkerStatusBadge } from "@/components/badges";

export default function WorkersScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: listResult, isLoading } = useWorkerList(
    companyId,
    { status: "active" }
  );

  const workers = listResult?.data ?? [];

  const filtered = useMemo(() => {
    let items = workers;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      items = items.filter((w) => w.category === categoryFilter);
    }
    return items;
  }, [workers, search, categoryFilter]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 border-b">
        <Text className="text-xl font-semibold mb-3">Workers</Text>

        {/* Search */}
        <View className="flex-row items-center bg-muted rounded-lg px-3 py-2 mb-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search workers..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        {/* Filter toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center self-end"
        >
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Text className="ml-1 text-sm text-muted-foreground">
            {categoryFilter || "Filter"}
          </Text>
        </TouchableOpacity>

        {/* Filter options */}
        {showFilters && (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {["", "engineer", "surveyor", "assistant"].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full ${
                  categoryFilter === cat ? "bg-primary" : "bg-muted"
                }`}
              >
                <Text className={`text-sm ${
                  categoryFilter === cat ? "text-primary-foreground" : "text-muted-foreground"
                }`}>
                  {cat === "" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* List */}
      {isLoading ? (
        <WorkersListSkeleton />
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <Text className="text-lg text-muted-foreground mb-2">
            {workers.length === 0 ? "No workers yet" : "No matching workers"}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {filtered.map((worker) => (
            <Pressable
              key={worker.id}
              onPress={() => router.push(`/workers/${worker.id}`)}
              className="border-b px-4 py-3 active:bg-muted/50"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <User className="w-5 h-5 text-primary" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-base">{worker.name}</Text>
                  <Text className="text-sm text-muted-foreground">{worker.phone}</Text>
                </View>
                <WorkerCategoryBadge category={worker.category} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/workers/new")}
        className="absolute bottom-4 right-4 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </TouchableOpacity>
    </View>
  );
}

function WorkersListSkeleton() {
  return (
    <View className="flex-1 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="border-b py-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-muted mr-3" />
            <View className="flex-1">
              <View className="h-4 bg-muted rounded w-32 mb-2" />
              <View className="h-3 bg-muted rounded w-24" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] List displays with search
- [ ] Filter by category
- [ ] FAB to add new worker
- [ ] Loading skeletons

---

### Task 4.2: Create Mobile Worker Form Screen

**File:** `apps/mobile/app/workers/form.tsx` or similar

**Objective:** Create mobile form for creating/editing workers.

**Component Structure:**

```typescript
import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWorkerDetail, useCreateWorkerMutation, useUpdateWorkerMutation, useMyCompanies } from "@repo/api-client";
import { ArrowLeft, Save } from "@/components/icons";
import { Button } from "@/components/button";
import { Select } from "@/components/select";

export default function WorkerFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading } = useWorkerDetail(isEdit ? id : undefined);
  const worker = detailResult?.data;

  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<"engineer" | "surveyor" | "assistant">("assistant");
  const [salaryMonth, setSalaryMonth] = useState("0");
  const [salaryDay, setSalaryDay] = useState("0");

  // Load existing data on edit
  useState(() => {
    if (worker) {
      setName(worker.name);
      setPhone(worker.phone);
      setCategory(worker.category);
      setSalaryMonth(worker.salary_month.toString());
      setSalaryDay(worker.salary_day.toString());
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      category,
      salary_month: parseFloat(salaryMonth) || 0,
      salary_day: parseFloat(salaryDay) || 0,
    };

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ workerId: id, payload });
      if (result.error) {
        Alert.alert("Error", result.error.message);
        return;
      }
      router.back();
    } else if (companyId) {
      const result = await createMutation.mutateAsync({ companyId, payload });
      if (result.error) {
        Alert.alert("Error", result.error.message);
        return;
      }
      router.replace(`/workers/${result.data!.id}`);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 py-3 border-b">
          <Text className="text-lg font-semibold">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold">
          {isEdit ? "Edit Worker" : "New Worker"}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Basic Information */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            BASIC INFORMATION
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-sm mb-1">Name *</Text>
              <TextInput
                className="border rounded-lg px-3 py-2 bg-background"
                value={name}
                onChangeText={setName}
                placeholder="Worker name"
              />
            </View>

            <View>
              <Text className="text-sm mb-1">Phone *</Text>
              <TextInput
                className="border rounded-lg px-3 py-2 bg-background"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-sm mb-1">Category</Text>
              <Select
                value={category}
                onValueChange={setCategory}
                options={[
                  { label: "Engineer", value: "engineer" },
                  { label: "Surveyor", value: "surveyor" },
                  { label: "Assistant", value: "assistant" },
                ]}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm mb-1">Monthly Salary</Text>
                <TextInput
                  className="border rounded-lg px-3 py-2 bg-background"
                  value={salaryMonth}
                  onChangeText={setSalaryMonth}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm mb-1">Daily Salary</Text>
                <TextInput
                  className="border rounded-lg px-3 py-2 bg-background"
                  value={salaryDay}
                  onChangeText={setSalaryDay}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Skills section would go here */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            SKILLS
          </Text>
          <Text className="text-sm text-muted-foreground">
            Skills can be added after creating the worker.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-4 py-3 border-t bg-background">
        <Button
          onPress={handleSubmit}
          disabled={isPending}
          className="flex-row items-center justify-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Saving..." : isEdit ? "Update Worker" : "Create Worker"}
        </Button>
      </View>
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] Form validates required fields
- [ ] Create and edit modes work
- [ ] Navigation after save

---

### Task 4.3: Create Mobile Worker Detail Screen

**File:** `apps/mobile/app/workers/[id].tsx` or similar

**Objective:** Create mobile detail screen for worker.

**Component Structure:**

```typescript
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWorkerDetail, useArchiveWorkerMutation, useReactivateWorkerMutation } from "@repo/api-client";
import { ArrowLeft, Edit, Archive, RotateCcw, User, Phone, Wrench, Monitor } from "@/components/icons";
import { WorkerCategoryBadge, WorkerStatusBadge } from "@/components/badges";
import { Button } from "@/components/button";

export default function WorkerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: detailResult, isLoading } = useWorkerDetail(id);
  const worker = detailResult?.data;

  const archiveMutation = useArchiveWorkerMutation();
  const reactivateMutation = useReactivateWorkerMutation();

  async function handleArchive() {
    Alert.alert(
      "Archive Worker",
      "Are you sure you want to archive this worker?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            await archiveMutation.mutateAsync(id);
          },
        },
      ]
    );
  }

  async function handleReactivate() {
    await reactivateMutation.mutateAsync(id);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 py-3 border-b">
          <Text className="text-lg font-semibold">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!worker) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-lg text-muted-foreground">Worker not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold">{worker.name}</Text>
        <Pressable
          onPress={() => router.push(`/workers/${id}/edit`)}
          className="mr-3"
        >
          <Edit className="w-5 h-5 text-muted-foreground" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* Status Badge */}
        <View className="px-4 py-3 bg-muted/50">
          <WorkerStatusBadge status={worker.status} />
        </View>

        {/* Basic Information */}
        <View className="p-4 border-b">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            BASIC INFORMATION
          </Text>
          <View className="space-y-3">
            <View className="flex-row">
              <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Name</Text>
                <Text className="font-medium">{worker.name}</Text>
              </View>
            </View>
            <View className="flex-row">
              <Phone className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Phone</Text>
                <Text className="font-medium">{worker.phone}</Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="w-5 h-5 mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Category</Text>
                <WorkerCategoryBadge category={worker.category} />
              </View>
            </View>
            <View className="flex-row">
              <View className="w-5 h-5 mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Daily Salary</Text>
                <Text className="font-medium">${worker.salary_day.toFixed(2)}</Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="w-5 h-5 mr-3" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Monthly Salary</Text>
                <Text className="font-medium">${worker.salary_month.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Equipment Skills */}
        <View className="p-4 border-b">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 flex-row items-center">
            <Wrench className="w-4 h-4 mr-2" />
            EQUIPMENT SKILLS
          </Text>
          {worker.equipment_skills && worker.equipment_skills.length > 0 ? (
            <View className="space-y-2">
              {worker.equipment_skills.map((skill) => (
                <View key={skill.id} className="border rounded-lg p-3">
                  <Text className="font-medium">{skill.equipment_type}</Text>
                  <Text className="text-sm text-muted-foreground">{skill.equipment_brand}</Text>
                  <StarRating value={skill.proficiency_rating} />
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">No equipment skills</Text>
          )}
        </View>

        {/* Software Skills */}
        <View className="p-4 border-b">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 flex-row items-center">
            <Monitor className="w-4 h-4 mr-2" />
            SOFTWARE SKILLS
          </Text>
          {worker.software_skills && worker.software_skills.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {worker.software_skills.map((skill) => (
                <View
                  key={skill.id}
                  className="bg-secondary px-3 py-1 rounded-full"
                >
                  <Text className="text-sm">{skill.software.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">No software skills</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View className="px-4 py-3 border-t bg-background">
        {worker.status === "active" ? (
          <Button
            variant="destructive"
            onPress={handleArchive}
            disabled={archiveMutation.isPending}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Worker
          </Button>
        ) : (
          <Button
            variant="outline"
            onPress={handleReactivate}
            disabled={reactivateMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reactivate Worker
          </Button>
        )}
      </View>
    </View>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <View className="flex-row mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} className={star <= value ? "text-yellow-500" : "text-gray-300"}>
          ★
        </Text>
      ))}
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all worker details
- [ ] Archive/Reactivate actions
- [ ] Skills displayed

---

### Task 4.4: Create Mobile Skill Management Screens

**File:** `apps/mobile/app/workers/[id]/skills.tsx`

**Objective:** Create screens for adding/removing skills.

**Acceptance Criteria:**
- [ ] Add equipment skill screen
- [ ] Add software skill screen
- [ ] Star rating input
- [ ] Quick-add for new items

---

### Task 4.5: Update Mobile Navigation

**File:** Mobile app navigation config

**Objective:** Add workers to tab navigation or drawer.

**Acceptance Criteria:**
- [ ] Workers accessible from navigation
- [ ] Icon displayed

---

## Summary

### Task Count by Part

| Part | Tasks |
|------|-------|
| Part 1: Database Migrations | 5 tasks |
| Part 2: Backend Services | 7 tasks |
| Part 3: Web App | 7 tasks |
| Part 4: Mobile App | 5 tasks |
| **Total** | **24 tasks** |

### Implementation Order

1. **Phase 1 (Database)**: Tasks 1.1 → 1.5
2. **Phase 2 (Backend)**: Tasks 2.1 → 2.7
3. **Phase 3 (Web)**: Tasks 3.1 → 3.7
4. **Phase 4 (Mobile)**: Tasks 4.1 → 4.5

### Documentation Flow

- **Task 1.5** produces `api_schema.md` for backend developers
- **Task 2.7** produces `service_interface.md` for frontend developers

---

## Appendix: File Structure

### Database
```
supabase/migrations/
├── 20250212000001_workers_schema.sql
├── 20250212000002_workers_rls.sql
├── 20250212000003_workers_seed.sql
└── 20250212000004_workers_views.sql
```

### Backend
```
packages/types/src/
└── index.ts (add worker types)

packages/api-client/src/
├── services/
│   └── worker.ts
├── hooks/
│   └── use-worker.ts
├── schemas/
│   └── worker.ts
├── lib/
│   └── errors.ts (update)
└── index.ts (update exports)
```

### Web
```
apps/web/src/
├── components/
│   ├── ui/
│   │   └── quick-add-select.tsx (new)
│   └── workers/
│       └── worker-form.tsx
└── pages/
    └── workers/
        ├── list.tsx
        ├── form.tsx
        └── detail.tsx
```

### Mobile
```
apps/mobile/app/
└── workers/
    ├── index.tsx
    ├── form.tsx
    ├── [id].tsx
    └── [id]/
        └── skills.tsx
```

---

**Document End**
