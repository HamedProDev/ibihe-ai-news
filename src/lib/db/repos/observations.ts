/**
 * Market observation repository — Postgres when configured, else JSON.
 * Append-only: corrections are new rows, never updates.
 */
import type { MarketObservation } from '../../../types/market';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'market-observations';
const RETENTION = 5000;

export async function listObservationsRepo(): Promise<MarketObservation[]> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: MarketObservation }>(
        'SELECT data FROM market_observations ORDER BY observed_at DESC LIMIT $1',
        [RETENTION],
      );
      return r.rows.map((row) => row.data);
    } catch (err) {
      console.error('[db] observations pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return (await readStore<MarketObservation[]>(STORE))?.value ?? [];
}

/** Insert new rows; existing ids are skipped (idempotent re-runs). Returns total count. */
export async function appendObservationsRepo(rows: MarketObservation[]): Promise<number> {
  const fresh = rows.filter((o) => !o.isMock);
  if (isPostgresEnabled()) {
    try {
      for (const o of fresh) {
        await pgQuery(
          `INSERT INTO market_observations (id, commodity, district, market, observed_at, is_mock, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [o.id, o.commodity, o.district, o.market, o.observedAt, o.isMock, JSON.stringify(o)],
        );
      }
      const c = await pgQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM market_observations');
      return Number(c.rows[0]?.count ?? 0);
    } catch (err) {
      console.error('[db] observations pg append failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<MarketObservation[]>(STORE))?.value ?? [];
  const ids = new Set(existing.map((o) => o.id));
  const merged = [...existing, ...fresh.filter((o) => !ids.has(o.id))].slice(-RETENTION);
  await writeStore(STORE, merged);
  return merged.length;
}
