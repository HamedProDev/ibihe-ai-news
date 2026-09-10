/**
 * Forecast repository — Postgres when configured, else JSON.
 * Forecasts are upserted by stable id; evaluation mutates the same row's
 * evaluation/outcome fields but never rewrites the original prediction.
 */
import type { Forecast } from '../../../types/forecasting';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'forecasts';
const RETENTION = 1000;

export async function listForecastsRepo(): Promise<Forecast[]> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: Forecast }>(
        'SELECT data FROM forecasts ORDER BY created_at DESC LIMIT $1',
        [RETENTION],
      );
      return r.rows.map((row) => row.data);
    } catch (err) {
      console.error('[db] forecasts pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return (await readStore<Forecast[]>(STORE))?.value ?? [];
}

export async function saveForecastsRepo(list: Forecast[]): Promise<void> {
  const capped = list.slice(-RETENTION);
  if (isPostgresEnabled()) {
    try {
      for (const f of capped) {
        await pgQuery(
          `INSERT INTO forecasts (id, commodity, horizon, evaluation, model_version, created_at, resolves_at, is_mock, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             evaluation = EXCLUDED.evaluation, data = EXCLUDED.data, updated_at = now()`,
          [f.id, f.commodity, f.horizon, f.evaluation, f.modelVersion, f.createdAt, f.resolvesAt, f.isMock, JSON.stringify(f)],
        );
      }
      return;
    } catch (err) {
      console.error('[db] forecasts pg save failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  await writeStore(STORE, capped);
}
