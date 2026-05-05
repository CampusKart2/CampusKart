const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
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

async function main() {
  loadEnvFile();

  const migrationPath = process.argv[2];
  if (!migrationPath) {
    throw new Error("Usage: node scripts/run-migration.js <migration.sql>");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL. Add it to .env.local or your shell.");
  }

  const absolutePath = path.resolve(process.cwd(), migrationPath);
  const sql = fs.readFileSync(absolutePath, "utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied migration: ${migrationPath}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed.");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
