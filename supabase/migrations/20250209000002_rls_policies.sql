-- ============================================================
-- Migration 02: Row Level Security policies
-- Scope: loginSignup branch
-- ============================================================

-- 1. Enable RLS on all tables (deny by default)
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 2. Helper: get all company IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS SETOF uuid AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Helper: check if current user has a specific role in a company
CREATE OR REPLACE FUNCTION public.has_company_role(_company_id uuid, _role public.app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id    = auth.uid()
      AND company_id = _company_id
      AND role       = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES policies
-- ============================================================

-- Users can read their own profile
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- COMPANIES policies
-- ============================================================

-- Members can read companies they belong to
CREATE POLICY companies_select_member ON public.companies
  FOR SELECT USING (id IN (SELECT public.get_my_company_ids()));

-- Any authenticated user can create a company (during onboarding)
CREATE POLICY companies_insert_authenticated ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can update their company
CREATE POLICY companies_update_owner ON public.companies
  FOR UPDATE USING (public.has_company_role(id, 'owner'))
  WITH CHECK (public.has_company_role(id, 'owner'));

-- ============================================================
-- COMPANY_MEMBERS policies
-- ============================================================

-- Members can see other members in their companies
CREATE POLICY cm_select_same_company ON public.company_members
  FOR SELECT USING (company_id IN (SELECT public.get_my_company_ids()));

-- Owners can add members to their company, OR a user can insert their own owner row (onboarding)
CREATE POLICY cm_insert_allowed ON public.company_members
  FOR INSERT WITH CHECK (
    -- The user is inserting themselves (onboarding: creating owner membership)
    (user_id = auth.uid() AND role = 'owner')
    OR
    -- An existing owner is adding someone to their company
    public.has_company_role(company_id, 'owner')
  );

-- Only owners can remove members
CREATE POLICY cm_delete_owner ON public.company_members
  FOR DELETE USING (public.has_company_role(company_id, 'owner'));
