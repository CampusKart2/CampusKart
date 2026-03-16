-- Migration: 0004_create_categories_table
-- Epic: 02. Marketplace & Search  |  Sprint 1  |  Task T-25
-- User Story [02.03]: Browse By Category
--
-- Creates the categories table and seeds it with the canonical category set.
-- Listings.category stores the category slug (lowercase); unknown slugs
-- in GET /api/listings?category= must return 404.

CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  slug TEXT   NOT NULL UNIQUE,
  name TEXT   NOT NULL
);

-- Seed canonical categories (idempotent: skip if slug already exists).
INSERT INTO categories (slug, name)
VALUES
  ('books', 'Books'),
  ('electronics', 'Electronics'),
  ('furniture', 'Furniture'),
  ('clothing', 'Clothing'),
  ('other', 'Other')
ON CONFLICT (slug) DO NOTHING;
