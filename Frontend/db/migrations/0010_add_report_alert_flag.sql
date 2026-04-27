-- Migration: 0010_add_report_alert_flag
-- Epic: 03. Listing Management  |  Sprint 3  |  Task T-65
--
-- Adds a report_alert_sent_at timestamp to listings so the application can
-- guarantee the admin threshold email is sent exactly once, even under
-- concurrent reporters.  The column is NULL until the threshold is crossed;
-- the route atomically sets it to NOW() in the same transaction as the
-- INSERT into reports, making it an idempotent gate.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = current_schema()
    AND    table_name   = 'listings'
    AND    column_name  = 'report_alert_sent_at'
  ) THEN
    ALTER TABLE listings
      ADD COLUMN report_alert_sent_at TIMESTAMPTZ;
  END IF;
END $$;

-- Partial index: only indexes the rows that still need to be checked.
-- Once the flag is set the row drops out of this index, keeping it tiny.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE  schemaname = current_schema()
    AND    tablename  = 'listings'
    AND    indexname  = 'idx_listings_report_alert_unsent'
  ) THEN
    CREATE INDEX idx_listings_report_alert_unsent
      ON listings (id)
      WHERE report_alert_sent_at IS NULL;
  END IF;
END $$;
