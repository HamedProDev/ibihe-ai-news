import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireAdminAuth } from '@/lib/auth/session';
import { parseMarketCsv } from '@/lib/market/sources/csv';
import { appendObservations } from '@/lib/market/store';

/**
 * Admin CSV import for REAL market observations.
 * Body: { csv: string } in the canonical format (see lib/market/sources/csv.ts).
 * Invalid rows are rejected with row-level errors; valid rows still import.
 */
export async function POST(req: NextRequest) {
  // Admin session cookie OR legacy ADMIN_SECRET bearer.
  const admin = await requireAdminAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  try {
    const body = (await req.json().catch(() => null)) as { csv?: unknown } | null;
    const csv = typeof body?.csv === 'string' ? body.csv : '';
    if (!csv.trim()) {
      return err('bad-request', 'Ohereza CSV.', 'Missing csv body.', 400);
    }
    if (csv.length > 500_000) {
      return err('too-large', 'CSV ni nini (max 500KB).', 'CSV too large (max 500KB).', 413);
    }
    const parsed = parseMarketCsv(csv);
    const total = parsed.rows.length > 0 ? await appendObservations(parsed.rows) : 0;
    return ok({ added: parsed.rows.length, total, errors: parsed.errors.slice(0, 50) }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/market/import]', e);
    return err('import-failed', 'Import yananiwe.', 'Import failed.');
  }
}
