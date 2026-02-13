-- ============================================================
-- Migration: 20250213000001_customers_schema.sql
-- Description: Customers Module - Core Schema (Enums, Tables, Indexes, Triggers)
-- Scope: 003-customers-module
-- Dependencies: Core schema (companies, profiles, company_members)
-- ============================================================

-- 1. Create Enums
-- ============================================================

CREATE TYPE public.customer_type AS ENUM ('individual', 'company', 'government');
CREATE TYPE public.customer_status AS ENUM ('active', 'inactive', 'prospect');

COMMENT ON TYPE public.customer_type IS 'Customer classification: individual person, company, or government entity';
COMMENT ON TYPE public.customer_status IS 'Customer business status: active, inactive, or prospect';

-- 2. Customers Table (main entity)
-- ============================================================

CREATE TABLE public.customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  customer_type public.customer_type NOT NULL DEFAULT 'company',
  status        public.customer_status NOT NULL DEFAULT 'active',
  phone         text CHECK (char_length(phone) <= 20),
  email         text CHECK (char_length(email) <= 100),
  address       text CHECK (char_length(address) <= 500),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  -- Business rule: Customer names must be unique per company (excluding soft-deleted)
  CONSTRAINT customers_company_name_unique UNIQUE (company_id, name, deleted_at),
  -- Email format validation (if provided)
  CONSTRAINT customers_email_valid CHECK (
    email IS NULL OR
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  -- Phone format validation (basic international format)
  CONSTRAINT customers_phone_valid CHECK (
    phone IS NULL OR
    phone ~ '^[\+]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}$'
  )
);

-- Indexes for common query patterns
CREATE INDEX idx_customers_company_id ON public.customers (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_company_status ON public.customers (company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_company_type ON public.customers (company_id, customer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_company_search ON public.customers (company_id, name, phone) WHERE deleted_at IS NULL;
-- Index for soft-delete operations
CREATE INDEX idx_customers_deleted_at ON public.customers (deleted_at) WHERE deleted_at IS NOT NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.customers IS 'Customer records with soft-delete support. Multi-tenant via company_id.';

-- 3. Customer Contacts Table (child entity - hard delete allowed)
-- ============================================================

CREATE TABLE public.customer_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name         text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  role         text CHECK (char_length(role) <= 100),
  department    text CHECK (char_length(department) <= 100),
  phone         text NOT NULL CHECK (char_length(phone) <= 20),
  email         text CHECK (char_length(email) <= 100),
  is_primary    boolean NOT NULL DEFAULT false,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Email format validation (if provided)
  CONSTRAINT customer_contacts_email_valid CHECK (
    email IS NULL OR
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  -- Phone format validation
  CONSTRAINT customer_contacts_phone_valid CHECK (
    phone ~ '^[\+]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}$'
  )
);

-- Indexes for common query patterns
CREATE INDEX idx_customer_contacts_customer_id ON public.customer_contacts (customer_id);
CREATE INDEX idx_customer_contacts_primary ON public.customer_contacts (customer_id, is_primary) WHERE is_primary = true;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_customer_contacts_updated_at
  BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.customer_contacts IS 'Contact persons for customers. One customer can have multiple contacts. Hard delete on customer cascade.';

-- 4. Customer Sites Table (child entity - soft delete)
-- ============================================================

CREATE TABLE public.customer_sites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name            text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  address          text CHECK (char_length(address) <= 500),
  city            text CHECK (char_length(city) <= 100),
  gps_coordinates text CHECK (char_length(gps_coordinates) <= 50),
  landmarks       text CHECK (char_length(landmarks) <= 200),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  -- Business rule: Site names must be unique per customer (excluding soft-deleted)
  CONSTRAINT customer_sites_customer_name_unique UNIQUE (customer_id, name, deleted_at),
  -- GPS coordinate format validation (decimal latitude, longitude)
  CONSTRAINT customer_sites_gps_valid CHECK (
    gps_coordinates IS NULL OR
    gps_coordinates ~ '^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$'
  )
);

-- Indexes for common query patterns
CREATE INDEX idx_customer_sites_customer_id ON public.customer_sites (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_sites_city ON public.customer_sites (city);
CREATE INDEX idx_customer_sites_gps ON public.customer_sites (gps_coordinates) WHERE gps_coordinates IS NOT NULL;
-- Index for soft-delete operations
CREATE INDEX idx_customer_sites_deleted_at ON public.customer_sites (deleted_at) WHERE deleted_at IS NOT NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trg_customer_sites_updated_at
  BEFORE UPDATE ON public.customer_sites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.customer_sites IS 'Physical locations/sites where work is performed for customers. Soft-delete support.';

-- 5. Primary Contact Enforcement Function
-- ============================================================
-- Ensures only one contact can be marked as primary per customer

CREATE OR REPLACE FUNCTION public.enforce_single_primary_contact()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Remove primary flag from other contacts for the same customer
    UPDATE public.customer_contacts
    SET is_primary = false
    WHERE customer_id = NEW.customer_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_primary_contact
  BEFORE INSERT OR UPDATE ON public.customer_contacts
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.enforce_single_primary_contact();

COMMENT ON FUNCTION public.enforce_single_primary_contact() IS 'Trigger function to ensure only one primary contact per customer';

-- ============================================================
-- End of Migration 20250213000001_customers_schema.sql
-- ============================================================
