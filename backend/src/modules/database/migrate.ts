import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../../config/env";

const { Pool } = pg;

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function applyMigrations(pool: pg.Pool): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const applied: string[] = [];

  for (const filename of files) {
    const existing = await pool.query("SELECT id FROM schema_migrations WHERE id = $1", [
      filename,
    ]);
    if ((existing.rowCount ?? 0) > 0) continue;

    const sql = await readFile(join(MIGRATIONS_DIR, filename), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      applied.push(filename);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return applied;
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_ENABLED) {
    throw new Error("DATABASE_ENABLED must be true to run migrations");
  }
  if (!env.DATABASE_URL.trim()) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const applied = await applyMigrations(pool);
    const message =
      applied.length === 0
        ? "Migrations already up to date"
        : `Applied migrations: ${applied.join(", ")}`;
    console.info(message);
  } finally {
    await pool.end();
  }
}

const isDirectRun = process.argv[1]?.includes("migrate");
if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Migration failed";
    console.error(message);
    process.exit(1);
  });
}
