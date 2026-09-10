import { NextRequest } from 'next/server';
import { readIngestMeta, runIngestion } from '@/lib/news/ingest';
import { requireCron } from '@/lib/api/auth';
import { ok, err } from '@/lib/api/envelope';

/**
 * GET: ingest status (public meta only).
 * GET ?run=1 with a valid CRON_SECRET bearer ALSO triggers a run —
 * this is the shape Vercel Cron uses (GET + automatic Bearer header).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('run') === '1') {
      if (!process.env.CRON_SECRET) {
        return err('ingest-disabled', 'Ingest ntirikora.', 'Ingestion is not configured.', 503);
      }
      if (!requireCron(req)) {
        return err('unauthorized', 'Nta burenganzira.', 'Unauthorized.', 401);
      }
      const result = await runIngestion();
      return ok(result, 'live');
    }
    const meta = await readIngestMeta();
    return ok({ meta }, 'live');
  } catch (e) {
    console.error('[api/ingest GET]', e);
    return err('ingest-failed', 'Amakuru ntabonetse.', 'Status unavailable.');
  }
}

/**
 * Trigger an ingestion run. Protected: requires CRON_SECRET bearer token
 * (same secret used by the scheduler/worker). Never exposed to browsers.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return err('ingest-disabled', 'Ingest ntirikora.', 'Ingestion is not configured.', 503);
    }
    if (!requireCron(req)) {
      return err('unauthorized', 'Nta burenganzira.', 'Unauthorized.', 401);
    }
    const result = await runIngestion();
    return ok(result, 'live');
  } catch (e) {
    console.error('[api/ingest POST]', e);
    return err('ingest-failed', 'Ingest yananiwe.', 'Ingestion failed.');
  }
}
