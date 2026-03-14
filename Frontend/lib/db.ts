
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
