-- Migration: 0001_create_users_table
-- Epic: 01. Account Management  |  Sprint 1
-- Creates the core users table.
-- The .edu constraint is enforced at the app layer (Zod); this CHECK is a DB safety net.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(80)  NOT NULL,
  -- DB-level guard: app layer (Zod) already rejects non-.edu addresses
  email          VARCHAR(254) NOT NULL UNIQUE
                   CHECK (email ~* '^[^\s@]+@[^\s@]+\.edu$'),
  password_hash  TEXT         NOT NULL,
  -- T-02: defaults to false; set true only after email confirmation (T-03)
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Automatically refresh updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
