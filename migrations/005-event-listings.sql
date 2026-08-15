-- Migration 005: Event Listings
-- Run in Supabase SQL Editor after running Prisma migration for EventListing / EventListingReport models.

-- 1. Mosque-organized constraint: if isMosqueOrganized is true, mosqueName must be set
ALTER TABLE public.event_listings
  ADD CONSTRAINT mosque_organized_requires_name
  CHECK (
    "isMosqueOrganized" = FALSE
    OR ("isMosqueOrganized" = TRUE AND "mosqueName" IS NOT NULL AND "mosqueName" <> '')
  );

-- 2. Row-Level Security
ALTER TABLE public.event_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_listing_reports ENABLE ROW LEVEL SECURITY;

-- event_listings: public read of ACTIVE non-expired listings
CREATE POLICY "Public can read active event listings"
  ON public.event_listings
  FOR SELECT
  USING (
    status = 'ACTIVE'
    AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
  );

-- event_listings: authenticated users can insert (organizer flow; server action validates)
CREATE POLICY "Authenticated users can create event listings"
  ON public.event_listings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- event_listings: organizer can read their own listings (all statuses)
CREATE POLICY "Organizer can read own event listings"
  ON public.event_listings
  FOR SELECT
  USING (
    "organizerUserId" IN (
      SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text
    )
  );

-- event_listing_reports: authenticated users can insert a report (once per listing per user)
CREATE POLICY "Authenticated users can report event listings"
  ON public.event_listing_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- event_listing_reports: reporter can read their own reports
CREATE POLICY "Reporter can read own event listing reports"
  ON public.event_listing_reports
  FOR SELECT
  USING (
    "reportedById" IN (
      SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text
    )
  );
