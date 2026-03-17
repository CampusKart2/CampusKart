-- Migration: 0005_create_listing_views_table
-- Epic: 02. Marketplace & Search  |  Sprint 1  |  Task T-31
--
-- Tracks unique listing views per session so view_count increments
-- at most once per user session per listing.

CREATE TABLE IF NOT EXISTS listing_views (
  listing_id   UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  session_hash TEXT        NOT NULL,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (listing_id, session_hash)
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id
  ON listing_views (listing_id);

