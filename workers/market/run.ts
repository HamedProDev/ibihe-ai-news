/**
 * Market pull worker — fetches all enabled real market adapters and appends
 * validated observations (history is append-only).
 *
 * Usage:
 *   node workers/market/run.ts
 *   # or via HTTP: GET /api/cron/market  (Authorization: Bearer $CRON_SECRET)
 */
import '../../src/lib/env.ts'; // must load first: plain node ignores .env files
import { appendObservations } from '../../src/lib/market/store.ts';
import { pullMarketSources } from '../../src/lib/market/sources/registry.ts';

async function main(): Promise<void> {
  const pulled = await pullMarketSources();
  console.log(`[worker:market] adapters=[${pulled.adapters.join(', ') || 'none'}] rows=${pulled.rows.length} errors=${pulled.errors.length}`);
  for (const e of pulled.errors.slice(0, 10)) console.log(`  - ${e}`);
  if (pulled.rows.length > 0) {
    const total = await appendObservations(pulled.rows);
    console.log(`[worker:market] stored total=${total}`);
  } else if (pulled.adapters.length === 0) {
    console.log('[worker:market] no adapters enabled — set ESOKO_FEED_URL or use POST /api/market/import.');
  }
}

main().catch((err: unknown) => {
  console.error('[worker:market] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
