-- Add region field to sponsored_listings for GTA region-based slot caps.
-- Also backfill existing rows so the slot-cap logic can work retroactively
-- (existing rows without a region stay uncapped until they are re-created).
ALTER TABLE sponsored_listings ADD COLUMN IF NOT EXISTS region TEXT;
