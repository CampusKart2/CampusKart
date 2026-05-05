const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");
const MIGRATIONS_TABLE = "schema_migrations";

function loadEnvFile() {
  for (const fileName of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }

      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT filename FROM ${MIGRATIONS_TABLE}`
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function markApplied(client, filename) {
  await client.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (filename)
     VALUES ($1)
     ON CONFLICT (filename) DO NOTHING`,
    [filename]
  );
}

async function objectExists(client, objectName) {
  const result = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [objectName]
  );
  return result.rows[0].exists;
}

async function columnExists(client, tableName, columnName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = $1
         AND column_name = $2
     ) AS exists`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

async function typeExists(client, typeName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_type
       WHERE typname = $1
         AND typnamespace = (
           SELECT oid FROM pg_namespace WHERE nspname = current_schema()
         )
     ) AS exists`,
    [typeName]
  );
  return result.rows[0].exists;
}

async function functionExists(client, functionName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_proc
       WHERE proname = $1
         AND pronamespace = (
           SELECT oid FROM pg_namespace WHERE nspname = current_schema()
         )
     ) AS exists`,
    [functionName]
  );
  return result.rows[0].exists;
}

async function looksAlreadyApplied(client, filename) {
  if (filename.includes("0005_create_listing_views_table")) {
    return objectExists(client, "listing_views");
  }
  if (filename.includes("0006_add_listings_location")) {
    return columnExists(client, "listings", "location");
  }
  if (filename.includes("0007_add_listing_photo_order_constraints")) {
    return objectExists(client, "idx_listing_photos_listing_position");
  }
  if (filename.includes("0008_add_listing_condition_enum")) {
    return typeExists(client, "listing_condition");
  }
  if (filename.includes("0009_create_reports_table")) {
    return objectExists(client, "reports");
  }
  if (filename.includes("0010_add_report_alert_flag")) {
    return columnExists(client, "listings", "report_alert_sent_at");
  }
  if (filename.includes("0011_add_current_report_reason_values")) {
    return typeExists(client, "report_reason");
  }
  if (filename.includes("0012_create_getstream_notifications")) {
    return objectExists(client, "getstream_webhook_notifications");
  }
  if (filename.includes("0013_message_notification_feed")) {
    return objectExists(client, "message_notification_feed");
  }
  if (filename.includes("0014_create_blocked_users_table")) {
    return objectExists(client, "blocked_users");
  }
  if (filename.includes("0015_create_reviews_table")) {
    return objectExists(client, "reviews");
  }
  if (filename.includes("0016_add_listings_buyer_sold_at")) {
    return columnExists(client, "listings", "buyer_id");
  }
  if (filename.includes("0017_sync_user_review_rating_summary")) {
    return functionExists(client, "recalculate_user_rating_summary");
  }
  if (filename.includes("0018_create_password_reset_tokens")) {
    return objectExists(client, "password_reset_tokens");
  }

  return false;
}

async function runMigration(client, filename) {
  const migrationPath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(migrationPath, "utf8");

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await markApplied(client, filename);
    await client.query("COMMIT");
    console.log(`Applied: ${filename}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function showStatus(client, files) {
  const applied = await getAppliedMigrations(client);
  for (const file of files) {
    console.log(`${applied.has(file) ? "applied " : "pending "} ${file}`);
  }
}

async function main() {
  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL. Set it on the server or in .env.local.");
  }

  const files = getMigrationFiles();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);

    if (process.argv.includes("--status")) {
      await showStatus(client, files);
      return;
    }

    const applied = await getAppliedMigrations(client);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skip:    ${file}`);
        continue;
      }

      if (await looksAlreadyApplied(client, file)) {
        await markApplied(client, file);
        applied.add(file);
        console.log(`Mark:    ${file} already exists`);
        continue;
      }

      await runMigration(client, file);
      applied.add(file);
    }

    console.log("Database migrations complete.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Database migration failed.");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
