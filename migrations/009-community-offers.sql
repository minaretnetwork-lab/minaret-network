-- Community Offers: time-limited ads posted by approved professionals
CREATE TYPE "CommunityOfferTier" AS ENUM ('WEEKEND', 'STANDARD', 'FEATURED');
CREATE TYPE "CommunityOfferStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS community_offers (
  id                        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  "professionalId"          TEXT        NOT NULL REFERENCES professionals(id),
  title                     TEXT        NOT NULL,
  description               TEXT        NOT NULL,
  "imageUrl"                TEXT,
  tier                      "CommunityOfferTier"   NOT NULL DEFAULT 'STANDARD',
  price                     NUMERIC(10, 2)          NOT NULL,
  status                    "CommunityOfferStatus"  NOT NULL DEFAULT 'PENDING',
  "startDate"               TIMESTAMPTZ,
  "expiresAt"               TIMESTAMPTZ,
  "adminNote"               TEXT,
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId"   TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "community_offers_status_expiresAt_idx" ON community_offers(status, "expiresAt");
CREATE INDEX IF NOT EXISTS "community_offers_professionalId_createdAt_idx" ON community_offers("professionalId", "createdAt");
