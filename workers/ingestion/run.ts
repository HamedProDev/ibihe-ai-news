/**
 * Ingestion worker — run on a schedule (cron / Vercel Cron → /api/ingest).
 *
 * Usage:
 *   node workers/ingestion/run.ts
 *   # or via HTTP: POST /api/ingest  (Authorization: Bearer $CRON_SECRET)
 */
import '../../src/lib/env.ts'; // must load first: plain node ignores .env files
import { runIngestion } from '../../src/lib/news/ingest.ts';

async function main(): Promise<void> {
  const result = await runIngestion();
  console.log(`[worker:ingestion] added=${result.added} total=${result.total} errors=${result.errors.length}`);
  for (const e of result.errors) console.log(`  - ${e}`);
}

main().catch((err: unknown) => {
  console.error('[worker:ingestion] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
