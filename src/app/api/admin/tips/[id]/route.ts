import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { updateTipRepo, type TipStatus } from '@/lib/db/repos/engage';
import { recordAuditRepo } from '@/lib/db/repos/audit';

const STATUSES = new Set<TipStatus>(['new', 'investigating', 'published', 'archived']);

/** Triage a tip: status, assignee, internal note, linked article. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const status = body.status === undefined ? undefined : (String(body.status) as TipStatus);
    if (status !== undefined && !STATUSES.has(status)) return err('bad-status', 'Imimerere ntago ariyo.', 'Unknown tip status.', 400);
    const saved = await updateTipRepo(id, {
      ...(status ? { status } : {}),
      ...(body.assignedTo !== undefined ? { assignedTo: String(body.assignedTo).slice(0, 80) } : {}),
      ...(body.adminNote !== undefined ? { adminNote: String(body.adminNote).slice(0, 2000) } : {}),
      ...(body.articleId !== undefined ? { articleId: String(body.articleId).slice(0, 80) || undefined } : {}),
    });
    if (!saved) return err('not-found', 'Amakuru ntayabonetse.', 'Tip not found.', 404);
    await recordAuditRepo(g.user, 'tip.update', 'tip', id, status ?? 'note');
    return ok({ updated: saved }, 'live');
  } catch (e) {
    console.error('[api/admin/tips/[id] PUT]', e);
    return err('tip-update-failed', 'Ntibyabitswe.', 'Could not update tip.');
  }
}
