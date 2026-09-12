/**
 * Database migration entrypoint.
 *
 * Usage:
 *   npm run db:migrate
 *
 * Requires DATABASE_URL. Safe to re-run (tracks applied versions).
 */
import '../src/lib/env.ts'; // must load first: plain node ignores .env files
import { migrate } from '../src/lib/db/migrate.ts';
import { isPostgresEnabled } from '../src/lib/db/postgres.ts';

async function main(): Promise<void> {
  if (!isPostgresEnabled()) {
    console.error('[db:migrate] DATABASE_URL is not set — nothing to do.');
    process.exitCode = 1;
    return;
  }
  const result = await migrate();
  console.log(`[db:migrate] applied=${result.applied.length} skipped=${result.skipped.length}`);
  for (const f of result.applied) console.log(`  + ${f}`);
}

main().catch((err: unknown) => {
  console.error('[db:migrate] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
