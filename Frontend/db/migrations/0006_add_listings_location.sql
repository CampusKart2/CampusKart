-- Migration: 0006_add_listings_location
-- Epic: 02. Marketplace & Search  |  Sprint 2  |  Task T-35
--
-- Enables PostGIS and adds a nullable geography point column so listings
-- can store nearby-search coordinates without backfilling existing rows.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_listings_location
  ON listings USING GIST (location);
