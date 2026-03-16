-- Migration: 0003_create_listings_table_and_search_index
-- Epic: 02. Marketplace & Search  |  Sprint 1  |  Task T-16
-- User Story [02.01]: Search Listings
--
-- Adds the core listings table and a full-text search index on (title + description)
-- using a generated tsvector column. The GIN index ensures sub-200 ms search latency
-- for typical queries over ~10k rows on modest Postgres instances.

CREATE TABLE IF NOT EXISTS listings (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT         NOT NULL,
  description   TEXT         NOT NULL,
  price_cents   INTEGER      NOT NULL CHECK (price_cents >= 0),
  condition     TEXT         NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
  category      TEXT         NOT NULL,
  thumbnail_url TEXT,
  seller_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view_count    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- tsvector column combining title + description.
-- Generated column keeps the index in sync without application-layer triggers.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

-- GIN index over the generated search_vector column.
CREATE INDEX IF NOT EXISTS idx_listings_search_vector
  ON listings
  USING GIN (search_vector);

-- Optional composite index to support common sort orders for search results.
CREATE INDEX IF NOT EXISTS idx_listings_created_at_desc
  ON listings (created_at DESC);

