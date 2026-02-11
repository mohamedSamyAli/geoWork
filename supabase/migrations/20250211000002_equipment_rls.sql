-- ============================================================
-- Migration 06: RLS policies for equipment module tables
-- Scope: 001-equipment-module branch
-- Reuses: get_my_company_ids(), has_company_role() from migration 02
-- ============================================================

-- 1. Enable RLS on all new tables
ALTER TABLE public.equipment_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_partners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EQUIPMENT_TYPES policies
-- ============================================================

-- Everyone can see system types (company_id IS NULL) + their company's custom types
CREATE POLICY et_select_visible ON public.equipment_types
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (SELECT public.get_my_company_ids())
  );

-- Only owners can create custom types for their company
CREATE POLICY et_insert_owner ON public.equipment_types
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- Only owners can delete their company's custom types (not system types)
CREATE POLICY et_delete_owner ON public.equipment_types
  FOR DELETE USING (
    company_id IS NOT NULL AND public.has_company_role(company_id, 'owner')
  );

-- ============================================================
-- SUPPLIERS policies
-- ============================================================

CREATE POLICY suppliers_select_member ON public.suppliers
  FOR SELECT USING (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY suppliers_insert_owner ON public.suppliers
  FOR INSERT WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY suppliers_update_owner ON public.suppliers
  FOR UPDATE USING (public.has_company_role(company_id, 'owner'))
  WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY suppliers_delete_owner ON public.suppliers
  FOR DELETE USING (public.has_company_role(company_id, 'owner'));

-- ============================================================
-- PARTNERS policies
-- ============================================================

CREATE POLICY partners_select_member ON public.partners
  FOR SELECT USING (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY partners_insert_owner ON public.partners
  FOR INSERT WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY partners_update_owner ON public.partners
  FOR UPDATE USING (public.has_company_role(company_id, 'owner'))
  WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY partners_delete_owner ON public.partners
  FOR DELETE USING (public.has_company_role(company_id, 'owner'));

-- ============================================================
-- EQUIPMENT policies (no DELETE — equipment cannot be deleted)
-- ============================================================

CREATE POLICY equipment_select_member ON public.equipment
  FOR SELECT USING (company_id IN (SELECT public.get_my_company_ids()));

CREATE POLICY equipment_insert_owner ON public.equipment
  FOR INSERT WITH CHECK (public.has_company_role(company_id, 'owner'));

CREATE POLICY equipment_update_owner ON public.equipment
  FOR UPDATE USING (public.has_company_role(company_id, 'owner'))
  WITH CHECK (public.has_company_role(company_id, 'owner'));

-- ============================================================
-- EQUIPMENT_PARTNERS policies (scoped via equipment's company_id)
-- ============================================================

CREATE POLICY ep_select_member ON public.equipment_partners
  FOR SELECT USING (
    equipment_id IN (
      SELECT id FROM public.equipment
      WHERE company_id IN (SELECT public.get_my_company_ids())
    )
  );

CREATE POLICY ep_insert_owner ON public.equipment_partners
  FOR INSERT WITH CHECK (
    equipment_id IN (
      SELECT id FROM public.equipment
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY ep_update_owner ON public.equipment_partners
  FOR UPDATE USING (
    equipment_id IN (
      SELECT id FROM public.equipment
      WHERE public.has_company_role(company_id, 'owner')
    )
  ) WITH CHECK (
    equipment_id IN (
      SELECT id FROM public.equipment
      WHERE public.has_company_role(company_id, 'owner')
    )
  );

CREATE POLICY ep_delete_owner ON public.equipment_partners
  FOR DELETE USING (
    equipment_id IN (
      SELECT id FROM public.equipment
      WHERE public.has_company_role(company_id, 'owner')
    )
  );
