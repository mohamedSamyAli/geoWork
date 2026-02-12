-- ============================================================
-- Migration 04: Workers module — views for API queries
-- Scope: 002-worker-module
-- Purpose: Simplify common API queries with pre-aggregated data
-- ============================================================

-- View: Workers with equipment skills aggregated
-- Used by: Worker list/detail endpoints that need equipment skills
CREATE OR REPLACE VIEW public.v_workers_with_equipment_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', wes.id,
      'equipment_type', wes.equipment_type,
      'equipment_brand', wes.equipment_brand,
      'proficiency_rating', wes.proficiency_rating,
      'created_at', wes.created_at
    ) ORDER BY wes.equipment_type, wes.equipment_brand
  ) FILTER (WHERE wes.id IS NOT NULL) AS equipment_skills
FROM public.workers w
LEFT JOIN public.worker_equipment_skills wes ON wes.worker_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY
  w.id, w.company_id, w.name, w.phone, w.category,
  w.salary_month, w.salary_day, w.status,
  w.created_at, w.updated_at;

COMMENT ON VIEW public.v_workers_with_equipment_skills IS
  'Workers with equipment skills aggregated as JSONB. Excludes soft-deleted workers.';

-- View: Workers with software skills aggregated (with software names)
-- Used by: Worker list/detail endpoints that need software skills
CREATE OR REPLACE VIEW public.v_workers_with_software_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'id', wss.id,
      'software_id', wss.software_id,
      'software_name', s.name,
      'created_at', wss.created_at
    ) ORDER BY s.name
  ) FILTER (WHERE wss.id IS NOT NULL) AS software_skills
FROM public.workers w
LEFT JOIN public.worker_software_skills wss ON wss.worker_id = w.id
LEFT JOIN public.software s ON s.id = wss.software_id
WHERE w.deleted_at IS NULL
GROUP BY
  w.id, w.company_id, w.name, w.phone, w.category,
  w.salary_month, w.salary_day, w.status,
  w.created_at, w.updated_at;

COMMENT ON VIEW public.v_workers_with_software_skills IS
  'Workers with software skills aggregated as JSONB including software names. Excludes soft-deleted workers.';

-- View: Workers with all skills (combined)
-- Used by: Worker detail page that shows both skill types
CREATE OR REPLACE VIEW public.v_workers_with_skills AS
SELECT
  w.id,
  w.company_id,
  w.name,
  w.phone,
  w.category,
  w.salary_month,
  w.salary_day,
  w.status,
  w.created_at,
  w.updated_at,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', wes.id,
        'equipment_type', wes.equipment_type,
        'equipment_brand', wes.equipment_brand,
        'proficiency_rating', wes.proficiency_rating,
        'created_at', wes.created_at
      ) ORDER BY wes.equipment_type, wes.equipment_brand
    )
    FROM public.worker_equipment_skills wes
    WHERE wes.worker_id = w.id
  ) AS equipment_skills,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', wss.id,
        'software_id', wss.software_id,
        'software_name', s.name,
        'created_at', wss.created_at
      ) ORDER BY s.name
    )
    FROM public.worker_software_skills wss
    LEFT JOIN public.software s ON s.id = wss.software_id
    WHERE wss.worker_id = w.id
  ) AS software_skills
FROM public.workers w
WHERE w.deleted_at IS NULL;

COMMENT ON VIEW public.v_workers_with_skills IS
  'Workers with both equipment and software skills aggregated as JSONB. Excludes soft-deleted workers.';

-- View: Software list with company flag
-- Used by: Quick-add component to show available software
CREATE OR REPLACE VIEW public.v_software_list AS
SELECT
  s.id,
  s.company_id,
  s.name,
  s.is_seeded,
  s.created_at,
  s.company_id IS NULL AS is_system
FROM public.software s
ORDER BY s.is_seeded DESC, s.name ASC;

COMMENT ON VIEW public.v_software_list IS
  'Software list with system flag for UI display. System software shown first.';

-- View: Equipment brands list with company flag
-- Used by: Quick-add component for equipment brands
CREATE OR REPLACE VIEW public.v_equipment_brands_list AS
SELECT
  eb.id,
  eb.company_id,
  eb.name,
  eb.created_at,
  eb.company_id IS NULL AS is_system
FROM public.equipment_brands eb
ORDER BY eb.name ASC;

COMMENT ON VIEW public.v_equipment_brands_list IS
  'Equipment brands list with system flag for UI display.';
