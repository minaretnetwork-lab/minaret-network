-- Add region to featured_listings (per-region slot model, 6 slots per region)
ALTER TABLE featured_listings ADD COLUMN IF NOT EXISTS region TEXT;
