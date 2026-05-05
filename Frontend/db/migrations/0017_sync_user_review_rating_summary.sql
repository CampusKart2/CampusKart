-- T-82: Keep users.average_rating in sync when reviews change.
-- The profile API reads the stored aggregate from users, so review writes must
-- update that row inside PostgreSQL.

ALTER TABLE users
  ALTER COLUMN average_rating SET DEFAULT 0.00,
  ALTER COLUMN rating_count SET DEFAULT 0;

ALTER TABLE users
  ALTER COLUMN average_rating TYPE NUMERIC(3,2)
  USING COALESCE(average_rating, 0.00)::NUMERIC(3,2);

UPDATE users u
SET
  rating_count = review_stats.rating_count,
  average_rating = review_stats.average_rating
FROM (
  SELECT
    u.id AS user_id,
    COUNT(r.id)::INTEGER AS rating_count,
    COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0.00)::NUMERIC(3,2) AS average_rating
  FROM users u
  LEFT JOIN reviews r ON r.seller_id = u.id
  GROUP BY u.id
) AS review_stats
WHERE u.id = review_stats.user_id;

ALTER TABLE users
  ALTER COLUMN average_rating SET NOT NULL,
  ALTER COLUMN rating_count SET NOT NULL;

CREATE OR REPLACE FUNCTION recalculate_user_rating_summary(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    rating_count = review_stats.rating_count,
    average_rating = review_stats.average_rating
  FROM (
    SELECT
      COUNT(*)::INTEGER AS rating_count,
      COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00)::NUMERIC(3,2) AS average_rating
    FROM reviews
    WHERE seller_id = target_user_id
  ) AS review_stats
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_user_rating_summary(OLD.seller_id);
    RETURN OLD;
  END IF;

  PERFORM recalculate_user_rating_summary(NEW.seller_id);

  IF TG_OP = 'UPDATE' AND OLD.seller_id <> NEW.seller_id THEN
    PERFORM recalculate_user_rating_summary(OLD.seller_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_rating ON reviews;

CREATE TRIGGER trg_sync_user_rating
  AFTER INSERT OR UPDATE OF seller_id, rating OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_user_rating();
