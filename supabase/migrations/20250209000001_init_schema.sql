-- ============================================================
-- Migration 01: Core schema for auth profiles, companies, and membership
-- Scope: loginSignup branch
-- ============================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'member');

-- 2. Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL CHECK (char_length(full_name) > 0),
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profile extending Supabase Auth. One row per auth.users row.';

-- 3. Companies table (tenant)
CREATE TABLE public.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.companies IS 'Tenant / organization. Root scope for all business entities.';

-- 4. Company members (user ↔ company join with role)
CREATE TABLE public.company_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, company_id)
);

COMMENT ON TABLE public.company_members IS 'Maps users to companies with a role. Determines tenant access.';

-- 5. Indexes for RLS helper performance
CREATE INDEX idx_company_members_user_id    ON public.company_members (user_id);
CREATE INDEX idx_company_members_company_id ON public.company_members (company_id);

-- 6. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Apply updated_at triggers
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
