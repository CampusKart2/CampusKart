import { Pool, type QueryResult, type QueryResultRow } from "pg";

// prevents multiple pool instances in dev due to hot reload
const globalForDb = global as typeof globalThis & { dbPool?: Pool };

const CONNECTION_ERROR_MESSAGE =
  "Failed to connect to database. Check DATABASE_URL in .env.local";

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing required env var: DATABASE_URL");
  }

  const pool = new Pool({
    connectionString,
    // AWS RDS requires SSL
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on("error", (err) => {
    console.error(CONNECTION_ERROR_MESSAGE, err);
  });

  return pool;
}

function getPool(): Pool {
  if (!globalForDb.dbPool) {
    globalForDb.dbPool = createPool();
  }
  return globalForDb.dbPool;
}

/**
 * Lazy singleton Pool.
 *
 * Important: we intentionally do NOT create the pool at module load time so
 * `next build` / CI can run without DATABASE_URL unless a route actually hits
 * the database.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop: string | symbol): unknown {
    const p = getPool();
    const value = Reflect.get(p, prop) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(p);
    }
    return value;
  },
}) as unknown as Pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result: QueryResult<T> = await getPool().query<T>(text, params);
    return result.rows;
  } catch (err) {
    console.error(CONNECTION_ERROR_MESSAGE, err);
    throw err;
  }
}
