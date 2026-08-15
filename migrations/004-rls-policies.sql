-- ============================================================
-- Migration: Row-Level Security policies
-- Run via Supabase SQL Editor.
-- These are defence-in-depth — the application layer also enforces
-- ownership, but RLS ensures direct API/SQL calls cannot bypass it.
-- ============================================================

-- Enable RLS on tables that need it (safe to run even if already enabled)
ALTER TABLE public.professionals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_edit_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- ── Professionals ──────────────────────────────────────────────────────────────
-- Supabase auth.uid() is a UUID; our users.supabaseId is stored as text.

-- Anyone can read approved listings.
DROP POLICY IF EXISTS "professionals select approved" ON public.professionals;
CREATE POLICY "professionals select approved"
  ON public.professionals FOR SELECT
  USING (status = 'APPROVED');

-- Admins can read all listings.
DROP POLICY IF EXISTS "professionals select admin" ON public.professionals;
CREATE POLICY "professionals select admin"
  ON public.professionals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE "supabaseId" = auth.uid()::text
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Professionals can read their own listing regardless of status.
DROP POLICY IF EXISTS "professionals select own" ON public.professionals;
CREATE POLICY "professionals select own"
  ON public.professionals FOR SELECT
  USING (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  );

-- Professionals can update only their own listing.
DROP POLICY IF EXISTS "professionals update own" ON public.professionals;
CREATE POLICY "professionals update own"
  ON public.professionals FOR UPDATE
  USING (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  )
  WITH CHECK (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  );

-- Professionals can delete only their own listing.
DROP POLICY IF EXISTS "professionals delete own" ON public.professionals;
CREATE POLICY "professionals delete own"
  ON public.professionals FOR DELETE
  USING (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  );

-- Server-side inserts (via service role key) bypass RLS — no INSERT policy needed.

-- ── Recommendations ────────────────────────────────────────────────────────────

-- Anyone can read approved recommendations.
DROP POLICY IF EXISTS "recommendations select approved" ON public.recommendations;
CREATE POLICY "recommendations select approved"
  ON public.recommendations FOR SELECT
  USING (status = 'APPROVED');

-- Authors can read their own recommendations.
DROP POLICY IF EXISTS "recommendations select own" ON public.recommendations;
CREATE POLICY "recommendations select own"
  ON public.recommendations FOR SELECT
  USING (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  );

-- Admins can read all.
DROP POLICY IF EXISTS "recommendations select admin" ON public.recommendations;
CREATE POLICY "recommendations select admin"
  ON public.recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE "supabaseId" = auth.uid()::text
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Authors can delete only their own recommendations.
DROP POLICY IF EXISTS "recommendations delete own" ON public.recommendations;
CREATE POLICY "recommendations delete own"
  ON public.recommendations FOR DELETE
  USING (
    "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
  );

-- ── Professional edit drafts ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "drafts select own" ON public.professional_edit_drafts;
CREATE POLICY "drafts select own"
  ON public.professional_edit_drafts FOR SELECT
  USING (
    "professionalId" IN (
      SELECT id FROM public.professionals
      WHERE "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
    )
  );

-- ── Conversations & messages ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "conversations select own" ON public.conversation_threads;
CREATE POLICY "conversations select own"
  ON public.conversation_threads FOR SELECT
  USING (
    "requesterId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
    OR "professionalId" IN (
      SELECT id FROM public.professionals
      WHERE "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "messages select own" ON public.conversation_messages;
CREATE POLICY "messages select own"
  ON public.conversation_messages FOR SELECT
  USING (
    "conversationId" IN (
      SELECT id FROM public.conversation_threads
      WHERE "requesterId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
         OR "professionalId" IN (
           SELECT id FROM public.professionals
           WHERE "userId" = (SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text)
         )
    )
  );
