-- Migration 006: event listings v2
-- Add imageUrl, approvedAt columns and PENDING_ADMIN status

ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE event_listings ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;

-- Postgres requires adding enum values outside a transaction
ALTER TYPE "EventListingStatus" ADD VALUE IF NOT EXISTS 'PENDING_ADMIN' BEFORE 'ACTIVE';
