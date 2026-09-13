import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireCron } from '@/lib/api/auth';
import { pullMarketSources } from '@/lib/market/sources/registry';
import { appendObservations } from '@/lib/market/store';

/**
 * Scheduler trigger: pull enabled real market adapters + append.
 * Protected by CRON_SECRET (Vercel Cron sends it automatically).
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return err('cron-disabled', 'Cron ntirikora.', 'Scheduler is not configured.', 503);
  }
  if (!requireCron(req)) {
    return err('unauthorized', 'Nta burenganzira.', 'Unauthorized.', 401);
  }
  try {
    const pulled = await pullMarketSources();
    const total = pulled.rows.length > 0 ? await appendObservations(pulled.rows) : 0;
    return ok(
      { adapters: pulled.adapters, added: pulled.rows.length, total, errors: pulled.errors.slice(0, 20) },
      'live',
    );
  } catch (e) {
    console.error('[api/cron/market]', e);
    return err('market-cron-failed', 'Market pull yananiwe.', 'Market pull failed.');
  }
}
