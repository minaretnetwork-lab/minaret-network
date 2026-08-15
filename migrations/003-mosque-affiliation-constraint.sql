-- ============================================================
-- Migration: mosque affiliation requires consent
-- Run via Supabase SQL Editor AFTER prisma db push.
-- ============================================================

-- Enforce at the DB level that a mosque affiliation may only be stored
-- when explicit consent was captured. Prevents any code path (application
-- bug, admin SQL, future migration) from silently publishing unconsented data.
ALTER TABLE public.professionals
  ADD CONSTRAINT mosque_affiliation_requires_consent
  CHECK ("mosqueId" IS NULL OR "mosqueAffiliationConsentAt" IS NOT NULL);
