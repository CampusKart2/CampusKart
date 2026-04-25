-- Migration: 0009_create_reports_table
-- Epic: 03. Listing Management  |  Sprint 3  |  Task T-62
--
-- Creates the reports table so students can flag listings that violate
-- campus marketplace policies.  Safe to run on databases bootstrapped
-- from schema.sql (idempotent via DO blocks and IF NOT EXISTS guards).

-- ----------------------------------------------------------------
-- 1. report_reason enum
--
--    Using an enum keeps reasons machine-readable and prevents
--    free-form garbage from reaching the moderation queue.
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_type
    WHERE  typname      = 'report_reason'
    AND    typtype      = 'e'
    AND    typnamespace = (
             SELECT oid FROM pg_namespace WHERE nspname = current_schema()
           )
  ) THEN
    CREATE TYPE report_reason AS ENUM (
      'prohibited_item',      -- item not allowed on campus marketplace
      'scam_or_fraud',        -- suspected scam or fraudulent listing
      'misleading_info',      -- inaccurate title, description, or photos
      'wrong_price',          -- price does not match the item advertised
      'spam',                 -- duplicate or irrelevant listing
      'other'                 -- catch-all; details captured in notes
    );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 2. reports table
--
--    reporter_id uses ON DELETE SET NULL so that the report is
--    preserved for moderation even if the reporter's account is
--    later removed.
--
--    listing_id uses ON DELETE CASCADE because a hard-deleted
--    listing (as opposed to soft-deleted via status='deleted')
--    has no page to moderate against, so its reports are moot.
--    In practice the app uses soft deletes, but the FK still
--    guards referential integrity.
--
--    The UNIQUE constraint on (listing_id, reporter_id) prevents
--    the same user from filing duplicate reports on one listing.
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.tables
    WHERE  table_schema = current_schema()
    AND    table_name   = 'reports'
  ) THEN
    CREATE TABLE reports (
      id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
      listing_id   UUID         NOT NULL
                     REFERENCES listings(id) ON DELETE CASCADE,
      reporter_id  UUID
                     REFERENCES users(id)    ON DELETE SET NULL,
      reason       report_reason NOT NULL,
      notes        TEXT,                        -- optional free-text elaboration
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

      -- One report per (listing, reporter) pair.
      CONSTRAINT uq_reports_listing_reporter UNIQUE (listing_id, reporter_id)
    );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 3. Indexes
--
--    idx_reports_listing_id  – fast lookup of all reports for a
--                              listing (admin moderation queue).
--    idx_reports_reporter_id – fast lookup of all reports filed
--                              by a user (abuse detection).
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE  schemaname = current_schema()
    AND    tablename  = 'reports'
    AND    indexname  = 'idx_reports_listing_id'
  ) THEN
    CREATE INDEX idx_reports_listing_id  ON reports(listing_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE  schemaname = current_schema()
    AND    tablename  = 'reports'
    AND    indexname  = 'idx_reports_reporter_id'
  ) THEN
    CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
  END IF;
END $$;
