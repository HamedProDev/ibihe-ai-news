/**
 * Stored daily briefings (one row per day) — Postgres when configured,
 * else JSON. Written by the briefing worker, read by /api/briefing and
 * the homepage AI-summary panel.
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'briefings';

export async function getBriefingRepo(day: string): Promise<Record<string, unknown> | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: Record<string, unknown> }>(
        'SELECT data FROM briefings WHERE day = $1',
        [day],
      );
      return r.rows[0]?.data ?? null;
    } catch (err) {
      console.error('[db] briefings pg get failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Record<string, Record<string, unknown>>>(STORE))?.value ?? {};
  return all[day] ?? null;
}

export async function saveBriefingRepo(day: string, data: Record<string, unknown>): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO briefings (day, data, created_at) VALUES ($1, $2, now())
         ON CONFLICT (day) DO UPDATE SET data = EXCLUDED.data`,
        [day, JSON.stringify(data)],
      );
      // Keep 90 days server-side.
      await pgQuery(`DELETE FROM briefings WHERE day < to_char(now() - interval '90 days', 'YYYY-MM-DD')`);
      return;
    } catch (err) {
      console.error('[db] briefings pg save failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Record<string, Record<string, unknown>>>(STORE))?.value ?? {};
  all[day] = data;
  const days = Object.keys(all).sort();
  for (const d of days.slice(0, Math.max(0, days.length - 90))) delete all[d];
  await writeStore(STORE, all);
}
