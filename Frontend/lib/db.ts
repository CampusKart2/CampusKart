
import { Pool } from "pg";

/**
 * Module-level singleton pool.
 * Next.js hot-reloads modules in development, which would exhaust DB connections.
 * Attaching to `globalThis` prevents duplicate pools across HMR cycles.
 */
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  return new Pool({
    connectionString,
    // Keep connections alive without overwhelming a small Postgres instance
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : false,
  });
}

export const db: Pool =
  globalThis._pgPool ?? (globalThis._pgPool = createPool());

import { Pool } from "pg"
import { config } from "./config"

// Prevents multiple pool instances in dev due to hot reload
const globalForDb = global as typeof globalThis & { dbPool?: Pool }

function createPool(): Pool {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  pool.on("error", (err) => {
    console.error("Failed to connect to database. Check DATABASE_URL in .env.local", err)
  })

  return pool
}

export const pool = globalForDb.dbPool ?? (globalForDb.dbPool = createPool())

/**
 * Run a parameterized query and return rows. Use this in API routes instead of
 * touching the pool directly.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await pool.query(text, params)
    return result.rows as T[]
  } catch (err) {
    console.error("Failed to connect to database. Check DATABASE_URL in .env.local", err)
    throw err
  }
}
