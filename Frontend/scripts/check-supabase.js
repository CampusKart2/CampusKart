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
    const now = await client.query("SELECT NOW() AS time");
    const categories = await client.query(
      "SELECT COUNT(*)::int AS count FROM categories"
    );

    console.log("Supabase database is reachable.");
    console.log("Connected at:", now.rows[0].time);
    console.log("Categories count:", categories.rows[0].count);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Supabase health check failed.");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
