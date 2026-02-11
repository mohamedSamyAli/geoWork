-- ============================================================
-- Migration 07: Seed default equipment types (system-level, company_id = NULL)
-- Scope: 001-equipment-module branch
-- ============================================================

INSERT INTO public.equipment_types (company_id, name) VALUES
  (NULL, 'Total Station'),
  (NULL, 'GPS / GNSS'),
  (NULL, 'Level'),
  (NULL, 'Theodolite'),
  (NULL, 'Drone / UAV'),
  (NULL, '3D Scanner'),
  (NULL, 'Echo Sounder'),
  (NULL, 'Other');
