-- ============================================================
-- Migration 01: Workers module — schema
-- Scope: 002-worker-module
-- Dependencies: Existing companies table, helper functions
-- ============================================================

-- 1. Create Enums
CREATE TYPE public.worker_category AS ENUM ('engineer', 'surveyor', 'assistant');
CREATE TYPE public.worker_status AS ENUM ('active', 'inactive');

COMMENT ON TYPE public.worker_category IS 'Worker job classification: engineer, surveyor, or assistant';
COMMENT ON TYPE public.worker_status IS 'Worker employment status: active or inactive (archived)';

-- 2. Software table (master data for software skills)
-- Supports system-wide software (company_id IS NULL) and company-specific software
CREATE TABLE public.software (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  is_seeded  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT software_company_name_unique UNIQUE (company_id, name)
);

-- System-wide unique constraint: seeded software names must be globally unique
CREATE UNIQUE INDEX uq_software_system_name
  ON public.software (name) WHERE company_id IS NULL;

-- Index for company queries
CREATE INDEX idx_software_company_id ON public.software (company_id);

-- Auto-update updated_at trigger
CREATE TRIGGER trg_software_updated_at
  BEFORE UPDATE ON public.software
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.software IS 'Master data for software skills. NULL company_id = system-wide default software.';

-- 3. Equipment brands table (master data for equipment skill brands)
-- Supports system-wide brands (company_id IS NULL) and company-specific brands
CREATE TABLE public.equipment_brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT equipment_brands_company_name_unique UNIQUE (company_id, name)
);

-- System-wide unique constraint: system brands must be globally unique
CREATE UNIQUE INDEX uq_equipment_brands_system_name
  ON public.equipment_brands (name) WHERE company_id IS NULL;

-- Index for company queries
CREATE INDEX idx_equipment_brands_company_id ON public.equipment_brands (company_id);

-- Auto-update updated_at trigger
CREATE TRIGGER trg_equipment_brands_updated_at
  BEFORE UPDATE ON public.equipment_brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.equipment_brands IS 'Master data for equipment brands. NULL company_id = system-wide default brands.';

-- 4. Workers table (main entity)
CREATE TABLE public.workers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  phone         text NOT NULL CHECK (char_length(phone) > 0 AND char_length(phone) <= 20),
  category      public.worker_category NOT NULL,
  salary_month  numeric(10,2) NOT NULL CHECK (salary_month >= 0),
  salary_day    numeric(10,2) NOT NULL CHECK (salary_day >= 0),
  status        public.worker_status NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  -- Business rule: Phone numbers must be unique per company
  CONSTRAINT workers_company_phone_unique UNIQUE (company_id, phone),
  -- Business rule: At least one salary should be positive
  CONSTRAINT workers_salary_positive CHECK (salary_month > 0 OR salary_day > 0)
);

-- Indexes for common queries
CREATE INDEX idx_workers_company_id ON public.workers (company_id);
CREATE INDEX idx_workers_company_status ON public.workers (company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_workers_company_category ON public.workers (company_id, category) WHERE deleted_at IS NULL;
-- Index for soft-delete filtering
CREATE INDEX idx_workers_deleted_at ON public.workers (deleted_at) WHERE deleted_at IS NOT NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.workers IS 'Worker profiles with salary information. Soft-deleted via deleted_at.';

-- 5. Worker equipment skills (many-to-many with ratings)
-- Stores worker proficiency with specific equipment type/brand combinations
CREATE TABLE public.worker_equipment_skills (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id          uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  equipment_type     text NOT NULL CHECK (char_length(equipment_type) > 0 AND char_length(equipment_type) <= 100),
  equipment_brand    text NOT NULL CHECK (char_length(equipment_brand) > 0 AND char_length(equipment_brand) <= 100),
  proficiency_rating integer NOT NULL CHECK (proficiency_rating BETWEEN 1 AND 5),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- Business rule: One skill entry per unique type/brand combination per worker
  CONSTRAINT worker_equipment_skills_unique UNIQUE (worker_id, equipment_type, equipment_brand)
);

-- Index for worker skill queries
CREATE INDEX idx_worker_equipment_skills_worker_id
  ON public.worker_equipment_skills (worker_id);

-- Auto-update updated_at trigger
CREATE TRIGGER trg_worker_equipment_skills_updated_at
  BEFORE UPDATE ON public.worker_equipment_skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.worker_equipment_skills IS 'Worker equipment proficiency with 1-5 star rating. Type/brand stored as text for flexibility.';

-- 6. Worker software skills (many-to-many relationship)
-- Links workers to software from the master software table
CREATE TABLE public.worker_software_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id  uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  software_id uuid NOT NULL REFERENCES public.software(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Business rule: One software entry per worker
  CONSTRAINT worker_software_skills_unique UNIQUE (worker_id, software_id)
);

-- Indexes for queries
CREATE INDEX idx_worker_software_skills_worker_id
  ON public.worker_software_skills (worker_id);
CREATE INDEX idx_worker_software_skills_software_id
  ON public.worker_software_skills (software_id);

COMMENT ON TABLE public.worker_software_skills IS 'Links workers to software skills from the software master table.';
