-- T-74: Block User relation table.
-- Stores directed blocks: blocker_id -> blocked_id.

CREATE TABLE blocked_users (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_blocked_users_blocker_blocked UNIQUE (blocker_id, blocked_id),
  CONSTRAINT chk_blocked_users_not_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocked_users_blocker_id
  ON blocked_users (blocker_id);

CREATE INDEX idx_blocked_users_blocked_id
  ON blocked_users (blocked_id);
