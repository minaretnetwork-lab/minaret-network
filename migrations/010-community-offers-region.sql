-- Add region to community_offers for per-region filtering
ALTER TABLE community_offers ADD COLUMN IF NOT EXISTS region TEXT;

CREATE INDEX IF NOT EXISTS "community_offers_region_status_idx" ON community_offers(region, status);
