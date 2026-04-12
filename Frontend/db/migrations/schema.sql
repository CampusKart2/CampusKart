-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;        -- needed in Sprint 2, add now

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT        NOT NULL UNIQUE,
  password_hash     TEXT        NOT NULL,
  full_name         TEXT        NOT NULL,
  avatar_url        TEXT,
  email_verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  average_rating    NUMERIC(3,2)         DEFAULT 0.00,  -- populated in Sprint 3
  rating_count      INTEGER              DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- .edu enforcement at DB level (belt + suspenders with app validation)
ALTER TABLE users
  ADD CONSTRAINT chk_edu_email
  CHECK (email ~* '^[^@]+@[^@]+\.edu$');

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- 2. EMAIL VERIFICATION TOKENS
-- ============================================================
CREATE TABLE email_verification_tokens (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evt_token   ON email_verification_tokens(token);
CREATE INDEX idx_evt_user_id ON email_verification_tokens(user_id);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id         SERIAL      PRIMARY KEY,
  slug       TEXT        NOT NULL UNIQUE,
  name       TEXT        NOT NULL,
  icon       TEXT,                          -- emoji or icon name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the 5 Sprint 1 categories
INSERT INTO categories (slug, name) VALUES
  ('books',       'Books'),
  ('electronics', 'Electronics'),
  ('furniture',   'Furniture'),
  ('clothing',    'Clothing'),
  ('other',       'Other');

-- ============================================================
-- 4. LISTINGS
-- ============================================================
CREATE TYPE listing_condition AS ENUM (
  'New', 'Like New', 'Good', 'Fair', 'Poor'
);

CREATE TYPE listing_status AS ENUM (
  'active', 'sold', 'deleted'
);

CREATE TABLE listings (
  id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id    UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INTEGER          NOT NULL REFERENCES categories(id),
  title        TEXT             NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2)    NOT NULL DEFAULT 0.00,  -- 0.00 = Free
  condition    listing_condition NOT NULL,
  status       listing_status   NOT NULL DEFAULT 'active',
  location     GEOGRAPHY(Point, 4326),                  -- PostGIS, Sprint 2
  view_count   INTEGER          NOT NULL DEFAULT 0,
  search_vector TSVECTOR,                               -- full-text search
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_seller_id   ON listings(seller_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status      ON listings(status);
CREATE INDEX idx_listings_price       ON listings(price);
CREATE INDEX idx_listings_created_at  ON listings(created_at DESC);
CREATE INDEX idx_listings_location    ON listings USING GIST(location);  -- Sprint 2
CREATE INDEX idx_listings_search      ON listings USING GIN(search_vector);

-- ============================================================
-- 5. AUTO-UPDATE search_vector ON INSERT / UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION listings_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')),       'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_search_vector
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION listings_search_vector_update();

-- ============================================================
-- 6. LISTING PHOTOS
-- ============================================================
CREATE TABLE listing_photos (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  position    SMALLINT    NOT NULL DEFAULT 0,   -- 0 = thumbnail
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_listing_photos_position_nonnegative CHECK (position >= 0),
  CONSTRAINT uq_listing_photos_listing_position UNIQUE (listing_id, position)
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos(listing_id);
CREATE INDEX idx_listing_photos_listing_position ON listing_photos(listing_id, position);

-- ============================================================
-- 7. AUTO-UPDATE updated_at ON ALL TABLES
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 🗺️ Relationship Map
```
users ──────────────< listings >──────── categories
  │                      │
  │                      └──────< listing_photos
  │
  └──────< email_verification_tokens
