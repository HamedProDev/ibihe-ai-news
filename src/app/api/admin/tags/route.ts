import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { listArticlesAdminRepo, listTagsRepo, upsertArticlesRepo } from '@/lib/db/repos/articles';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/** Tag cloud with story counts. */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const items = await listTagsRepo();
    return ok({ items, total: items.length }, 'live');
  } catch (e) {
    console.error('[api/admin/tags GET]', e);
    return err('tags-failed', 'Amagambo ntabonetse.', 'Could not load tags.');
  }
}

/** Rename or merge: { from, to } ('' deletes). */
export async function POST(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { from?: unknown; to?: unknown } | null;
    const from = String(body?.from ?? '').trim().toLowerCase();
    const toRaw = String(body?.to ?? '').trim().toLowerCase();
    if (!from) return err('bad-request', 'from irakenewe.', 'from is required.', 400);
    const { items } = await listArticlesAdminRepo({ limit: 500, tag: from });
    let changed = 0;
    for (const a of items) {
      const tags: string[] = [];
      for (const t of a.tags ?? []) {
        if (t === from) {
          if (toRaw && !tags.includes(toRaw)) tags.push(toRaw);
          continue;
        }
        if (!tags.includes(t)) tags.push(t);
      }
      await upsertArticlesRepo([{ ...a, tags }]);
      changed++;
    }
    await recordAuditRepo(g.user, toRaw ? 'tag.rename' : 'tag.delete', 'tag', from, `${changed} stories${toRaw ? ` → ${toRaw}` : ''}`);
    return ok({ changed, from, to: toRaw }, 'live');
  } catch (e) {
    console.error('[api/admin/tags POST]', e);
    return err('tag-failed', 'Izina ntiryahinduwe.', 'Could not rename tag.');
  }
}
