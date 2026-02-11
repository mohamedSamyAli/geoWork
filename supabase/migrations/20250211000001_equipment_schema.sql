-- ============================================================
-- Migration 05: Equipment module — enums, tables, indexes, constraints, triggers
-- Scope: 001-equipment-module branch
-- ============================================================

-- 1. Create enums
CREATE TYPE public.ownership_type AS ENUM ('owned', 'rented');
CREATE TYPE public.equipment_status AS ENUM ('active', 'inactive');

-- 2. Equipment types table (system defaults + company custom)
CREATE TABLE public.equipment_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique: one type name per company
ALTER TABLE public.equipment_types
  ADD CONSTRAINT uq_equipment_types_company_name UNIQUE (company_id, name);

-- Partial unique index: system types (company_id IS NULL) must also be unique by name
CREATE UNIQUE INDEX uq_equipment_types_system_name
  ON public.equipment_types (name) WHERE company_id IS NULL;

COMMENT ON TABLE public.equipment_types IS 'Predefined + custom equipment categories. company_id NULL = system default.';

-- 3. Suppliers table
CREATE TABLE public.suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0),
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, name)
);

CREATE INDEX idx_suppliers_company_id ON public.suppliers (company_id);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.suppliers IS 'Equipment rental suppliers, scoped per company.';

-- 4. Partners table
CREATE TABLE public.partners (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) > 0),
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, name)
);

CREATE INDEX idx_partners_company_id ON public.partners (company_id);

CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.partners IS 'Co-ownership partners, scoped per company.';

-- 5. Equipment table
CREATE TABLE public.equipment (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(name) > 0),
  serial_number     text NOT NULL,
  equipment_type_id uuid NOT NULL REFERENCES public.equipment_types(id) ON DELETE RESTRICT,
  model             text,
  ownership_type    public.ownership_type NOT NULL,
  status            public.equipment_status NOT NULL DEFAULT 'active',
  supplier_id       uuid REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  monthly_rent      numeric(12,2),
  daily_rent        numeric(12,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, serial_number),

  -- Rented equipment must have supplier and costs; owned must not
  CHECK (
    (ownership_type = 'rented' AND supplier_id IS NOT NULL AND monthly_rent IS NOT NULL AND daily_rent IS NOT NULL)
    OR
    (ownership_type = 'owned' AND supplier_id IS NULL AND monthly_rent IS NULL AND daily_rent IS NULL)
  )
);

CREATE INDEX idx_equipment_company_id  ON public.equipment (company_id);
CREATE INDEX idx_equipment_supplier_id ON public.equipment (supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_equipment_type_id     ON public.equipment (equipment_type_id);
CREATE INDEX idx_equipment_status      ON public.equipment (company_id, status);

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.equipment IS 'Surveying equipment registry. Supports owned and rented modes.';

-- 6. Equipment partners join table (N:M with percentage)
CREATE TABLE public.equipment_partners (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  partner_id   uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  percentage   numeric(5,2) NOT NULL CHECK (percentage >= 1 AND percentage <= 99),
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (equipment_id, partner_id)
);

CREATE INDEX idx_equipment_partners_equipment_id ON public.equipment_partners (equipment_id);
CREATE INDEX idx_equipment_partners_partner_id   ON public.equipment_partners (partner_id);

COMMENT ON TABLE public.equipment_partners IS 'Partner co-ownership of equipment with percentage shares.';

-- 7. Trigger function: enforce total partner ownership <= 100%
CREATE OR REPLACE FUNCTION public.check_equipment_partner_total()
RETURNS trigger AS $$
DECLARE
  _total numeric;
BEGIN
  SELECT COALESCE(SUM(percentage), 0) INTO _total
  FROM public.equipment_partners
  WHERE equipment_id = NEW.equipment_id
    AND id IS DISTINCT FROM NEW.id;

  IF (_total + NEW.percentage) > 100 THEN
    RAISE EXCEPTION 'Total partner ownership would be % which exceeds 100%%',
      (_total + NEW.percentage);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_equipment_partner_total
  BEFORE INSERT OR UPDATE ON public.equipment_partners
  FOR EACH ROW EXECUTE FUNCTION public.check_equipment_partner_total();
