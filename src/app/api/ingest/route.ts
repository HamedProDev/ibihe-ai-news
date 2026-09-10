import { NextRequest } from 'next/server';
import { readIngestMeta, runIngestion } from '@/lib/news/ingest';
import { ok, err } from '@/lib/api/envelope';

/** Ingest status (public meta only — no internals). */
export async function GET() {
  try {
    const meta = await readIngestMeta();
    return ok({ meta }, 'live');
  } catch (e) {
    console.error('[api/ingest GET]', e);
    return err('ingest-meta-failed', 'Amakuru ntabonetse.', 'Status unavailable.');
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
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return err('unauthorized', 'Nta burenganzira.', 'Unauthorized.', 401);
    }
    const result = await runIngestion();
    return ok(result, 'live');
  } catch (e) {
    console.error('[api/ingest POST]', e);
    return err('ingest-failed', 'Ingest yananiwe.', 'Ingestion failed.');
  }
}
