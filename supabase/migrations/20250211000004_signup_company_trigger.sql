-- ============================================================
-- Migration: Move company + membership creation into the auth trigger
-- Scope: fix/signup branch
-- ============================================================
-- Why: The previous two-step flow (signUp → onboard) fails when
-- Supabase email confirmation is enabled because there is no
-- active session after signUp. By creating the company inside
-- the auth trigger we get an atomic, session-independent flow.
-- This also prevents anyone from creating companies directly
-- from the client.
-- ============================================================

-- 1. Replace the auth trigger to also create company + owner membership
--    when company_name is provided in raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _company_name text;
  _company_id   uuid;
BEGIN
  -- Always create the profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL)
  );

  -- Create company + owner membership when a company name was supplied
  _company_name := NEW.raw_user_meta_data ->> 'company_name';

  IF _company_name IS NOT NULL AND _company_name <> '' THEN
    INSERT INTO public.companies (name)
    VALUES (_company_name)
    RETURNING id INTO _company_id;

    INSERT INTO public.company_members (user_id, company_id, role)
    VALUES (NEW.id, _company_id, 'owner');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remove client-side company creation (trigger handles it now)
DROP POLICY IF EXISTS companies_insert_authenticated ON public.companies;

-- 3. Tighten company_members insert: only existing owners can add members.
--    Self-insert during onboarding is no longer needed (trigger handles it).
DROP POLICY IF EXISTS cm_insert_allowed ON public.company_members;

CREATE POLICY cm_insert_owner ON public.company_members
  FOR INSERT WITH CHECK (
    public.has_company_role(company_id, 'owner')
  );

-- 4. Revoke client-side access to the onboarding RPC
REVOKE EXECUTE ON FUNCTION public.create_company_with_owner(text)
  FROM PUBLIC, anon, authenticated;
