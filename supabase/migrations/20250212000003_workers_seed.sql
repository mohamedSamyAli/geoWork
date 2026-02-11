-- ============================================================
-- Migration 03: Workers module — seed data
-- Scope: 002-worker-module
-- ============================================================

-- Seed system-wide software (company_id NULL = available to all companies)
-- These are the seeded software mentioned in the PRD
INSERT INTO public.software (id, company_id, name, is_seeded, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    NULL,
    'AutoCAD',
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    NULL,
    'Civil3D',
    true,
    now(),
    now()
  )
ON CONFLICT (name) WHERE company_id IS NULL DO NOTHING;

-- Note: Equipment brands are NOT seeded as companies will add them via quick-add
-- based on their actual equipment inventory
