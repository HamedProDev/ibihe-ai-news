/**
 * Forecasting worker — evaluates due forecasts and refreshes the daily set.
 *
 * Usage:
 *   node workers/forecasting/run.ts
 */
import '../../src/lib/env.ts'; // must load first: plain node ignores .env files
import { listForecasts } from '../../src/lib/forecasting/store.ts';

async function main(): Promise<void> {
  const result = await listForecasts();
  const t = result.trackRecord;
  console.log(
    `[worker:forecasting] total=${t.totalForecasts} evaluated=${t.evaluated} pending=${t.pending} ` +
      `accuracy=${t.accuracy ?? 'n/a'} model=${result.modelVersion} mode=${result.dataMode}`,
  );
}

main().catch((err: unknown) => {
  console.error('[worker:forecasting] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
