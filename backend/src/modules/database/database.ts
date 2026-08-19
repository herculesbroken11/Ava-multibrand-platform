import pg from "pg";
import { env } from "../../config/env";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function isDatabaseEnabled(): boolean {
  return env.DATABASE_ENABLED;
}

export function getPool(): pg.Pool {
  if (!env.DATABASE_ENABLED) {
    throw new Error("Database is not enabled");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = undefined;
  await current.end();
}

export async function pingDatabase(): Promise<boolean> {
  if (!env.DATABASE_ENABLED) return false;

  try {
    const result = await getPool().query("SELECT 1 AS ok");
    return Number(result.rows[0]?.ok) === 1;
  } catch {
    return false;
  }
}
