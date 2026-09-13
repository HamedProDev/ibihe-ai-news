import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import { listAuditRepo } from '@/lib/db/repos/audit';

/** Everything the console changed, newest first. */
export async function GET(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const items = await listAuditRepo({
      limit: Math.min(200, Math.max(1, Number(sp.get('limit') ?? 60) || 60)),
      entity: (sp.get('entity') ?? '').trim() || undefined,
    });
    return ok({ items }, 'live');
  } catch (e) {
    console.error('[api/admin/audit]', e);
    return err('audit-failed', 'Amateka ntibabonetse.', 'Could not load the audit log.');
  }
}
