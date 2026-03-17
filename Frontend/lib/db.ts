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

  // Proactively surface misconfiguration/connectivity issues on startup.
  pool
    .connect()
    .then((client) => client.release())
    .catch((err: unknown) => {
      console.error(CONNECTION_ERROR_MESSAGE, err);
    });

  pool.on("error", (err) => {
    console.error(CONNECTION_ERROR_MESSAGE, err);
  });

  return pool;
}

export const pool: Pool = globalForDb.dbPool ?? (globalForDb.dbPool = createPool());

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result: QueryResult<T> = await pool.query<T>(text, params);
    return result.rows;
  } catch (err) {
    console.error(CONNECTION_ERROR_MESSAGE, err);
    throw err;
  }
}
