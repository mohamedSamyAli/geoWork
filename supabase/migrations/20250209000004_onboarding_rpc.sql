-- ============================================================
-- Migration 04: Atomic onboarding RPC — create company + owner membership
-- Scope: loginSignup branch
-- ============================================================
-- Why: The onboarding flow must create a company and an owner membership
-- in a single transaction. Without this, a failure after the company insert
-- but before the membership insert would leave an orphaned company.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_company_with_owner(company_name text)
RETURNS json AS $$
DECLARE
  _company_id uuid;
  _member_id  uuid;
BEGIN
  -- 1. Create the company
  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO _company_id;

  -- 2. Insert the calling user as owner
  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (auth.uid(), _company_id, 'owner')
  RETURNING id INTO _member_id;

  -- 3. Return both IDs
  RETURN json_build_object(
    'company_id',    _company_id,
    'membership_id', _member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
