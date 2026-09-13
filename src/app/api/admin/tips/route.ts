import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { countTipsByStatusRepo, listTipsRepo } from '@/lib/db/repos/engage';

/** Reader tip inbox (?status=new|investigating|published|archived|all). */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const status = (sp.get('status') ?? 'new') as never;
    const items = await listTipsRepo({ status, limit: Math.min(300, Number(sp.get('limit') ?? 100) || 100) });
    const counts = await countTipsByStatusRepo();
    return ok({ items, counts, total: items.length }, 'live');
  } catch (e) {
    console.error('[api/admin/tips GET]', e);
    return err('tips-failed', 'Amakuru y’abomasomeshi ntayabonetse.', 'Could not load tips.');
  }
}
