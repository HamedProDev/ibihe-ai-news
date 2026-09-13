import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import { listSubscribersRepo } from '@/lib/db/repos/engage';

/** Newsletter list — JSON for the table, ?format=csv for export. */
export async function GET(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const items = await listSubscribersRepo({ limit: Math.min(5000, Number(sp.get('limit') ?? 1000) || 1000) });
    if (sp.get('format') === 'csv') {
      const rows = ['email,locale,created_at', ...items.map((s) => `${s.email},${s.locale},${s.createdAt}`)];
      return new Response(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ibihe-news-subscribers.csv"',
        },
      });
    }
    const byLocale = new Map<string, number>();
    for (const s of items) byLocale.set(s.locale, (byLocale.get(s.locale) ?? 0) + 1);
    return ok({ items, total: items.length, byLocale: [...byLocale.entries()].map(([locale, count]) => ({ locale, count })) }, 'live');
  } catch (e) {
    console.error('[api/admin/subscribers]', e);
    return err('subscribers-failed', 'Abiyandikishije ntibabonetse.', 'Could not load subscribers.');
  }
}
