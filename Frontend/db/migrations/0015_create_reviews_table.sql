-- T-77: Reviews table.
-- Stores one review per reviewer → seller pair.
-- average_rating and rating_count on users are kept in sync via trigger.

CREATE TABLE reviews (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       SMALLINT    NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- one review per buyer-seller pair
  CONSTRAINT uq_reviews_reviewer_seller UNIQUE (reviewer_id, seller_id),
  -- rating must be 1–5
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  -- cannot review yourself
  CONSTRAINT chk_reviews_not_self CHECK (reviewer_id <> seller_id)
);

CREATE INDEX idx_reviews_seller_id   ON reviews (seller_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews (reviewer_id);

-- ---------------------------------------------------------------
-- Trigger: keep users.average_rating + users.rating_count in sync
-- after every insert on reviews.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    rating_count   = (SELECT COUNT(*)        FROM reviews WHERE seller_id = NEW.seller_id),
    average_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE seller_id = NEW.seller_id)
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_user_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_user_rating();
