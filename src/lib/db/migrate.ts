/**
 * Minimal SQL migration runner (server-only).
 *
 * Applies supabase/migrations/*.sql in filename order, tracking applied
 * versions in schema_migrations. Each file runs in its own transaction.
 * Used by `npm run db:migrate` and documented for CI/deploy hooks.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pgQuery, withPgClient } from './postgres.ts';

export function migrationsDir(): string {
  return path.join(process.cwd(), 'supabase', 'migrations');
}

export function sortMigrationFiles(files: string[]): string[] {
  return files.filter((f) => f.endsWith('.sql')).sort();
}

export interface MigrateResult {
  applied: string[];
  skipped: string[];
}

export async function migrate(): Promise<MigrateResult> {
  const dir = migrationsDir();
  const entries = await fs.readdir(dir);
  const files = sortMigrationFiles(entries);

  await pgQuery(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const done = await pgQuery<{ version: string }>(`SELECT version FROM schema_migrations`);
  const appliedSet = new Set(done.rows.map((r) => r.version));

  const applied: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    if (appliedSet.has(file)) {
      skipped.push(file);
      continue;
    }
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    // One dedicated connection per file: BEGIN … COMMIT must never span
    // pooled connections (breaks on Supavisor/pgBouncer transaction mode).
    try {
      await withPgClient(async (client) => {
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK').catch(() => undefined);
          throw err;
        }
      });
      applied.push(file);
    } catch (err) {
      throw new Error(`[db] migration ${file} failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  return { applied, skipped };
}
