-- Migration: 0002_create_email_verification_tokens
-- Epic: 01. Account Management  |  Sprint 1  |  Task T-03
-- User Story [01.07]: Verify Student Email (.edu gate)
--
-- Stores short-lived tokens used for the email-verification flow.
-- One active token per user at a time (old tokens are replaced on resend).

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  -- 64-char hex string produced by crypto.randomBytes(32).toString('hex')
  token      TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Token is valid for 24 hours from issuance
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast look-up of all tokens for a given user (used on resend / cleanup)
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
