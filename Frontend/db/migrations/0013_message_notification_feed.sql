-- T-68: Per-recipient message alert rows for the notification dropdown (10 most recent via API).
-- Populated from GetStream webhook payloads (see derive-message-feed-rows + webhook route).

CREATE TABLE message_notification_feed (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_webhook_id     TEXT         NOT NULL,
  sender_stream_user_id TEXT         NOT NULL,
  sender_display_name   TEXT         NOT NULL,
  snippet               TEXT         NOT NULL,
  channel_type          TEXT         NOT NULL,
  channel_id            TEXT         NOT NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_message_notif_recipient_webhook UNIQUE (recipient_user_id, stream_webhook_id)
);

CREATE INDEX idx_message_notif_recipient_created
  ON message_notification_feed (recipient_user_id, created_at DESC);

COMMENT ON TABLE message_notification_feed IS
  'One row per recipient per Stream webhook delivery for message-style alerts.';
