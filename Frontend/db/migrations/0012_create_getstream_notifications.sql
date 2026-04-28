-- T-66: Inbound GetStream (Stream Chat) webhook events as durable notification rows.
-- Idempotency: X-Webhook-Id is unique so Stream retries do not create duplicates.

CREATE TABLE getstream_webhook_notifications (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  getstream_webhook_id  TEXT         NOT NULL,
  getstream_event_type  TEXT         NOT NULL,
  payload               JSONB        NOT NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_getstream_webhook_id UNIQUE (getstream_webhook_id)
);

CREATE INDEX idx_getstream_notif_type_created
  ON getstream_webhook_notifications (getstream_event_type, created_at DESC);

COMMENT ON TABLE getstream_webhook_notifications IS
  'One row per verified Stream Chat webhook delivery (e.g. message.new for message alerts).';
