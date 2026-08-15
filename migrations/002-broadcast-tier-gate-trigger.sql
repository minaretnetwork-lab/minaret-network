-- ============================================================
-- Migration: broadcast-tier gate trigger
-- Run via Supabase SQL Editor AFTER running prisma db push.
-- ============================================================

-- 1. Trigger function: blocks BROADCAST_ELIGIBLE tier on regulated profession categories.
--    The application layer already enforces this, but this trigger prevents bypass via
--    direct SQL, API, or any future code path that skips the application check.
CREATE OR REPLACE FUNCTION public.enforce_broadcast_tier_gate()
RETURNS trigger AS $$
BEGIN
  IF NEW.tier = 'BROADCAST_ELIGIBLE' THEN
    IF EXISTS (
      SELECT 1
      FROM public.categories
      WHERE id = NEW."categoryId"
        AND "isRegulatedProfession" = true
    ) THEN
      RAISE EXCEPTION
        'broadcast_eligible tier is not permitted for regulated professions (categoryId: %)',
        NEW."categoryId";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the professionals table.
DROP TRIGGER IF EXISTS check_broadcast_tier_gate ON public.professionals;
CREATE TRIGGER check_broadcast_tier_gate
  BEFORE INSERT OR UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_broadcast_tier_gate();

-- 3. Seed regulated-profession categories.
--    Adjust the slug list if your category names differ.
UPDATE public.categories
SET "isRegulatedProfession" = true
WHERE slug IN (
  -- Healthcare
  'doctor', 'dentist', 'pharmacist', 'physiotherapist',
  'chiropractor', 'optometrist', 'counsellor',
  -- Legal
  'lawyer', 'immigration-consultant', 'notary-public',
  -- Financial advisory
  'financial-advisor', 'insurance-broker', 'mortgage-broker',
  -- Real estate
  'realtor'
);

-- 4. Safety: demote any existing BROADCAST_ELIGIBLE listings whose category
--    was just marked regulated (guards against data that predates this migration).
UPDATE public.professionals p
SET tier = 'STANDARD'
WHERE p.tier = 'BROADCAST_ELIGIBLE'
  AND EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = p."categoryId"
      AND c."isRegulatedProfession" = true
  );
