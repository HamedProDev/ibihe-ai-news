/**
 * Meta key/value + ingest-run history — Postgres when configured, else JSON.
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export async function getMeta<T>(key: string): Promise<T | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: T }>('SELECT data FROM meta_store WHERE key = $1', [key]);
      return r.rows[0]?.data ?? null;
    } catch (err) {
      console.error('[db] meta pg get failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return (await readStore<T>(key))?.value ?? null;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO meta_store (key, data, updated_at) VALUES ($1,$2,now())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
      return;
    } catch (err) {
      console.error('[db] meta pg set failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  await writeStore(key, value);
}

export interface IngestRun {
  startedAt: string;
  finishedAt: string;
  added: number;
  total: number;
  errors: string[];
}

/** Append an ingest run to history (best-effort; JSON backend keeps last 50 in meta). */
export async function recordIngestRun(run: IngestRun): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        'INSERT INTO ingest_runs (started_at, finished_at, added, total, errors) VALUES ($1,$2,$3,$4,$5)',
        [run.startedAt, run.finishedAt, run.added, run.total, JSON.stringify(run.errors)],
      );
      return;
    } catch (err) {
      console.error('[db] ingest run record failed:', err instanceof Error ? err.message : err);
    }
  }
  const prev = (await readStore<IngestRun[]>('ingest-runs'))?.value ?? [];
  await writeStore('ingest-runs', [...prev, run].slice(-50));
}
