-- Migration: 0008_add_listing_condition_enum
-- Epic: 03. Listing Management  |  Sprint 2  |  Task T-52
--
-- Creates the listing_condition enum type and wires it to the listings table.
-- Safe to run on databases bootstrapped from schema.sql (idempotent).

-- ----------------------------------------------------------------
-- 1. Create the enum type only if it does not already exist.
--    PostgreSQL has no "CREATE TYPE IF NOT EXISTS" syntax, so we
--    guard with a DO block that checks pg_type.
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_type
    WHERE  typname   = 'listing_condition'
    AND    typtype   = 'e'               -- 'e' = enum
    AND    typnamespace = (
             SELECT oid FROM pg_namespace WHERE nspname = current_schema()
           )
  ) THEN
    CREATE TYPE listing_condition AS ENUM (
      'New',
      'Like New',
      'Good',
      'Fair',
      'Poor'
    );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 2. Add the column to listings if it does not already exist.
--
--    NOT NULL constraint requires a DEFAULT while the statement
--    runs so that any pre-existing rows receive a value.  We set
--    'Good' as a safe sentinel default, then immediately drop the
--    DEFAULT so the column has no server-side default going forward
--    (the application must always supply an explicit condition).
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = current_schema()
    AND    table_name   = 'listings'
    AND    column_name  = 'condition'
  ) THEN
    ALTER TABLE listings
      ADD COLUMN condition listing_condition NOT NULL DEFAULT 'Good';

    -- Drop the temporary default so callers are forced to be explicit.
    ALTER TABLE listings
      ALTER COLUMN condition DROP DEFAULT;
  END IF;
END $$;
