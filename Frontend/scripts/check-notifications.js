const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL. Add it to .env.local or your shell.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  await client.connect();

  try {
    const tables = await client.query(`
      SELECT
        to_regclass('public.getstream_webhook_notifications') AS webhook_table,
        to_regclass('public.message_notification_feed') AS feed_table
    `);
    console.log("Tables:", tables.rows[0]);

    if (tables.rows[0].webhook_table) {
      const webhookCounts = await client.query(`
        SELECT getstream_event_type, count(*)::int AS count, max(created_at) AS latest
        FROM getstream_webhook_notifications
        GROUP BY getstream_event_type
        ORDER BY latest DESC NULLS LAST
        LIMIT 10
      `);
      console.log("Webhook events:", webhookCounts.rows);
    }

    if (tables.rows[0].feed_table) {
      const feedSummary = await client.query(`
        SELECT count(*)::int AS count, max(created_at) AS latest
        FROM message_notification_feed
      `);
      console.log("Feed summary:", feedSummary.rows[0]);

      const latestFeed = await client.query(`
        SELECT recipient_user_id, sender_display_name, snippet, channel_type, channel_id, created_at
        FROM message_notification_feed
        ORDER BY created_at DESC
        LIMIT 5
      `);
      console.log("Latest feed rows:", latestFeed.rows);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Notification check failed.");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
