-- Add lat/lng to mosques
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create enum for jummah report status
DO $$ BEGIN
  CREATE TYPE "JummahReportStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create jummah_timings table
CREATE TABLE IF NOT EXISTS jummah_timings (
  id               TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mosque_id        TEXT NOT NULL,
  session          TEXT NOT NULL,
  khutbah_time     TEXT,
  iqamah_time      TEXT,
  notes            TEXT,
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT jummah_timings_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
  CONSTRAINT jummah_timings_mosque_id_session_key UNIQUE (mosque_id, session)
);

-- Create jummah_timing_reports table
CREATE TABLE IF NOT EXISTS jummah_timing_reports (
  id                    TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mosque_id             TEXT NOT NULL,
  session               TEXT,
  proposed_khutbah_time TEXT,
  proposed_iqamah_time  TEXT,
  submitter_email       TEXT,
  submitter_note        TEXT,
  status                "JummahReportStatus" NOT NULL DEFAULT 'PENDING',
  admin_note            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  CONSTRAINT jummah_timing_reports_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS jummah_timing_reports_status_created_at_idx ON jummah_timing_reports(status, created_at);
