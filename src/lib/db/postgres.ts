/**
 * Postgres connection layer (server-only).
 *
 * - Enabled only when DATABASE_URL is set (local Postgres, Supabase,
 *   Neon, ... — any Postgres over a connection string).
 * - Lazy singleton pool; no connection is opened at import time.
 * - SSL is enabled for non-localhost hosts (superset of Supabase needs).
 * - When disabled, repositories fall back to the JSON file store so the
 *   app runs anywhere with zero setup.
 */
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

if (typeof window !== 'undefined') {
  throw new Error('[db] postgres imported in browser — server-only');
}

export function isPostgresEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let pool: Pool | null = null;

function isLocalhost(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

export function pgPool(): Pool | null {
  if (!isPostgresEnabled()) return null;
  if (!pool) {
    const connectionString = process.env.DATABASE_URL as string;
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 8_000,
      ssl: isLocalhost(connectionString) ? undefined : { rejectUnauthorized: false },
    });
    pool.on('error', (err) => {
      console.error('[db] pool error:', err instanceof Error ? err.message : err);
    });
  }
  return pool;
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const p = pgPool();
  if (!p) throw new Error('[db] postgres is not configured (DATABASE_URL missing)');
  return p.query<T>(text, params as never[]);
}

/** Run work on one dedicated pooled connection (required for transactions). */
export async function withPgClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = pgPool();
  if (!p) throw new Error('[db] postgres is not configured (DATABASE_URL missing)');
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** Backend label for observability / footers. */
export function dbBackend(): 'postgres' | 'json' {
  return isPostgresEnabled() ? 'postgres' : 'json';
}
