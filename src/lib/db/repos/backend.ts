/**
 * Backend switch shared by the repositories: try Postgres when
 * DATABASE_URL is configured, fall back to the JSON file store on any
 * error so the app (and the console) keeps working.
 */
import { isPostgresEnabled } from '../postgres.ts';
import { readStore, writeStore } from '../json-store.ts';

export { readStore, writeStore };

export async function pgOrJson<T>(label: string, pg: () => Promise<T>, json: () => Promise<T>): Promise<T> {
  if (isPostgresEnabled()) {
    try {
      return await pg();
    } catch (err) {
      console.error(`[db] ${label} pg failed, using json store:`, err instanceof Error ? err.message : err);
    }
  }
  return json();
}

export async function readRows<T>(store: string, fallback: T[] = []): Promise<T[]> {
  const env = await readStore<T[]>(store);
  return env?.value ?? fallback;
}

export async function writeRows<T>(store: string, rows: T[]): Promise<void> {
  await writeStore(store, rows);
}

/** Stable, sortable id for new rows (time-prefixed so lexicographic = newest). */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
