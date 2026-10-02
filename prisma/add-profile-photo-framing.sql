-- Additive only: existing photos keep their centered framing.
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "photoFraming" JSONB;
