
import { Pool } from "pg";
import fs from "fs";
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
    ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("/home/jenkins/certs/us-east-1-bundle.pem").toString(),

    },
  });
}

// Lazy proxy — pool is created on first use, not at module load time.
// This prevents build-time failures when DATABASE_URL is not set.
export const db: Pool = new Proxy({} as Pool, {
  get(_target, prop: string | symbol) {
    const pool =
      globalThis._pgPool ?? (globalThis._pgPool = createPool());
    const value = (pool as any)[prop as string];
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
