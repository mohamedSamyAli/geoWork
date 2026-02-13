-- ============================================================
-- Migration: 20250213000002_customers_rls.sql
-- Description: Customers Module - Row Level Security Policies
-- Scope: 003-customers-module
-- Dependencies: 20250213000001_customers_schema.sql
-- ============================================================

-- 1. Enable RLS on all Customers Module tables (deny by default)
-- ============================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sites ENABLE ROW LEVEL SECURITY;

-- 2. RLS Helper Functions
-- ============================================================
-- Note: We use existing helper functions from the core schema:
-- - get_my_company_ids(): Returns set of company IDs the current user belongs to
-- - has_company_role(company_id, role): Checks if user has specific role in company

-- Additional helper: Check if a customer belongs to user's companies
CREATE OR REPLACE FUNCTION public.is_my_customer(_customer_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE id = _customer_id
      AND company_id IN (SELECT public.get_my_company_ids())
      AND deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_my_customer(_customer_id uuid) IS 'Check if a customer belongs to current user''s companies';

-- Additional helper: Check if a contact belongs to user's companies (via customer)
CREATE OR REPLACE FUNCTION public.is_my_customer_contact(_contact_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_contacts cc
    INNER JOIN public.customers c ON cc.customer_id = c.id
    WHERE cc.id = _contact_id
      AND c.company_id IN (SELECT public.get_my_company_ids())
      AND c.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_my_customer_contact(_contact_id uuid) IS 'Check if a customer contact belongs to current user''s companies';

-- Additional helper: Check if a site belongs to user's companies (via customer)
CREATE OR REPLACE FUNCTION public.is_my_customer_site(_site_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_sites cs
    INNER JOIN public.customers c ON cs.customer_id = c.id
    WHERE cs.id = _site_id
      AND c.company_id IN (SELECT public.get_my_company_ids())
      AND c.deleted_at IS NULL
      AND cs.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_my_customer_site(_site_id uuid) IS 'Check if a customer site belongs to current user''s companies';

-- ============================================================
-- CUSTOMERS Table RLS Policies
-- ============================================================

-- Policy: Members can read customers from their companies (excluding soft-deleted)
CREATE POLICY customers_read_own_company
  ON public.customers
  FOR SELECT
  USING (
    company_id IN (SELECT public.get_my_company_ids())
    AND deleted_at IS NULL
  );

-- Policy: Members can insert customers for their companies
CREATE POLICY customers_insert_own_company
  ON public.customers
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.get_my_company_ids())
  );

-- Policy: Members can update customers in their companies
CREATE POLICY customers_update_own_company
  ON public.customers
  FOR UPDATE
  USING (
    company_id IN (SELECT public.get_my_company_ids())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    company_id IN (SELECT public.get_my_company_ids())
  );

-- Policy: Members can soft-delete customers in their companies
CREATE POLICY customers_soft_delete_own_company
  ON public.customers
  FOR UPDATE
  USING (
    company_id IN (SELECT public.get_my_company_ids())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    company_id IN (SELECT public.get_my_company_ids())
    AND deleted_at IS NOT NULL  -- Setting deleted_at
  );

-- Policy: Members can hard-delete customers in their companies (for cascade cleanup)
-- Note: In production, soft-delete should be used. This policy exists for CASCADE operations.
CREATE POLICY customers_delete_own_company
  ON public.customers
  FOR DELETE
  USING (
    company_id IN (SELECT public.get_my_company_ids())
  );

-- ============================================================
-- CUSTOMER_CONTACTS Table RLS Policies
-- ============================================================

-- Policy: Members can read contacts for their companies' customers
CREATE POLICY customer_contacts_read_own_company
  ON public.customer_contacts
  FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- Policy: Members can insert contacts for their companies' customers
CREATE POLICY customer_contacts_insert_own_company
  ON public.customer_contacts
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- Policy: Members can update contacts in their companies
CREATE POLICY customer_contacts_update_own_company
  ON public.customer_contacts
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- Policy: Members can delete contacts in their companies (hard delete allowed)
CREATE POLICY customer_contacts_delete_own_company
  ON public.customer_contacts
  FOR DELETE
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- ============================================================
-- CUSTOMER_SITES Table RLS Policies
-- ============================================================

-- Policy: Members can read sites for their companies' customers (excluding soft-deleted)
CREATE POLICY customer_sites_read_own_company
  ON public.customer_sites
  FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- Policy: Members can insert sites for their companies' customers
CREATE POLICY customer_sites_insert_own_company
  ON public.customer_sites
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- Policy: Members can update sites in their companies
CREATE POLICY customer_sites_update_own_company
  ON public.customer_sites
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- Policy: Members can soft-delete sites in their companies
CREATE POLICY customer_sites_soft_delete_own_company
  ON public.customer_sites
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
    AND deleted_at IS NOT NULL  -- Setting deleted_at
  );

-- Policy: Members can hard-delete sites in their companies (for cascade cleanup)
-- Note: In production, soft-delete should be used. This policy exists for CASCADE operations.
CREATE POLICY customer_sites_delete_own_company
  ON public.customer_sites
  FOR DELETE
  USING (
    customer_id IN (
      SELECT c.id
      FROM public.customers c
      WHERE c.company_id IN (SELECT public.get_my_company_ids())
        AND c.deleted_at IS NULL
    )
  );

-- ============================================================
-- End of Migration 20250213000002_customers_rls.sql
-- ============================================================
