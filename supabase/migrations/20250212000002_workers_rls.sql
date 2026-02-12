-- ============================================================
-- Migration 02: Workers module — RLS policies
-- Scope: 002-worker-module
-- Dependencies: Migration 01, existing helper functions:
--   - get_my_company_ids() returns set of uuid for user's companies
--   - has_company_role(company_id, role) checks user's role in company
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_equipment_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_software_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SOFTWARE RLS Policies
-- Policy: System software (company_id IS NULL) visible to all companies
--         Company software visible only to owning company
--         Only owners can create/delete company-specific software
-- ============================================================

-- All users can see system software + their company's software
CREATE POLICY software_select_member ON public.software
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT public.get_my_company_ids())
  );

-- Only owners can create software for their company
CREATE POLICY software_insert_owner ON public.software
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- Only owners can update their company's software (not system software)
CREATE POLICY software_update_owner ON public.software
  FOR UPDATE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  )
  WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- Only owners can delete their company's software (not system software)
CREATE POLICY software_delete_owner ON public.software
  FOR DELETE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- EQUIPMENT BRANDS RLS Policies
-- Same pattern as software: system brands visible to all,
-- company brands visible only to owning company
-- ============================================================

CREATE POLICY equipment_brands_select_member ON public.equipment_brands
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT public.get_my_company_ids())
  );

CREATE POLICY equipment_brands_insert_owner ON public.equipment_brands
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

CREATE POLICY equipment_brands_update_owner ON public.equipment_brands
  FOR UPDATE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  )
  WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

CREATE POLICY equipment_brands_delete_owner ON public.equipment_brands
  FOR DELETE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- WORKERS RLS Policies
-- Policy: Full company scoping with owner/member roles
--         Soft-delete via status change, not hard delete
-- ============================================================

-- All members can view workers from their companies (excluding soft-deleted)
CREATE POLICY workers_select_member ON public.workers
  FOR SELECT USING (
    company_id IN (SELECT public.get_my_company_ids()) AND deleted_at IS NULL
  );

-- Only owners can create workers
CREATE POLICY workers_insert_owner ON public.workers
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- Only owners can update workers
CREATE POLICY workers_update_owner ON public.workers
  FOR UPDATE USING (
    public.has_company_role(company_id, 'owner')
  )
  WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- DELETE is blocked - use soft delete via status update instead
-- (No DELETE policy = deny all)

-- ============================================================
-- WORKER EQUIPMENT SKILLS RLS Policies
-- Policy: Scoped through worker's company_id
--         All operations require ownership of the worker's company
-- ============================================================

CREATE POLICY worker_equipment_skills_select_member ON public.worker_equipment_skills
  FOR SELECT USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE company_id IN (SELECT public.get_my_company_ids()) AND deleted_at IS NULL
    )
  );

CREATE POLICY worker_equipment_skills_insert_owner ON public.worker_equipment_skills
  FOR INSERT WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY worker_equipment_skills_update_owner ON public.worker_equipment_skills
  FOR UPDATE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  )
  WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY worker_equipment_skills_delete_owner ON public.worker_equipment_skills
  FOR DELETE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

-- ============================================================
-- WORKER SOFTWARE SKILLS RLS Policies
-- Policy: Scoped through worker's company_id
--         All operations require ownership of the worker's company
-- ============================================================

CREATE POLICY worker_software_skills_select_member ON public.worker_software_skills
  FOR SELECT USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE company_id IN (SELECT public.get_my_company_ids()) AND deleted_at IS NULL
    )
  );

CREATE POLICY worker_software_skills_insert_owner ON public.worker_software_skills
  FOR INSERT WITH CHECK (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY worker_software_skills_delete_owner ON public.worker_software_skills
  FOR DELETE USING (
    worker_id IN (
      SELECT id FROM public.workers
      WHERE public.has_company_role(company_id, 'owner')
    )
  );
