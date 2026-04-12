-- Migration: 0007_add_listing_photo_order_constraints
-- Ensures photo ordering is preserved per listing and that position 0 remains
-- the single source of truth for thumbnails across the app.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_listing_photos_position_nonnegative'
  ) THEN
    ALTER TABLE listing_photos
      ADD CONSTRAINT chk_listing_photos_position_nonnegative
      CHECK (position >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_listing_photos_listing_position'
  ) THEN
    ALTER TABLE listing_photos
      ADD CONSTRAINT uq_listing_photos_listing_position
      UNIQUE (listing_id, position);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_position
  ON listing_photos (listing_id, position);
