import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import { countCommentsByStatusRepo, deleteCommentRepo, listCommentsRepo, setCommentStatusRepo, type CommentStatus } from '@/lib/db/repos/comments';
import { recordAuditRepo } from '@/lib/db/repos/audit';

const STATUSES = new Set<CommentStatus>(['pending', 'approved', 'hidden', 'spam']);

/** Moderation queue (?status=pending|approved|hidden|all&article=&q=). */
export async function GET(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const status = (sp.get('status') ?? 'pending') as CommentStatus | 'all';
    const { items, total } = await listCommentsRepo({
      status: STATUSES.has(status as CommentStatus) ? status : 'all',
      articleId: (sp.get('article') ?? '').trim() || undefined,
      q: (sp.get('q') ?? '').trim() || undefined,
      limit: Math.min(200, Math.max(1, Number(sp.get('limit') ?? 50) || 50)),
      offset: Math.max(0, Number(sp.get('offset') ?? 0) || 0),
    });
    const counts = await countCommentsByStatusRepo();
    return ok({ items, total, counts }, 'live');
  } catch (e) {
    console.error('[api/admin/comments GET]', e);
    return err('comments-failed', 'Ibitekerezo ntibibonetse.', 'Could not load comments.');
  }
}

/** Moderate: { id, status, note? } or { ids: [], status } for bulk. */
export async function PATCH(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { id?: unknown; ids?: unknown; status?: unknown; note?: unknown } | null;
    const status = String(body?.status ?? '') as CommentStatus;
    if (!STATUSES.has(status)) return err('bad-status', 'Imimerere ntago ariyo.', 'Invalid status.', 400);
    const ids = Array.isArray(body?.ids)
      ? (body!.ids as unknown[]).map(String)
      : body?.id
        ? [String(body.id)]
        : [];
    if (!ids.length) return err('bad-request', 'id irakenewe.', 'id or ids required.', 400);
    let changed = 0;
    for (const id of ids.slice(0, 200)) {
      const updated = await setCommentStatusRepo(id, status, g.user?.email ?? 'admin', String(body?.note ?? '').slice(0, 400) || undefined);
      if (updated) changed++;
    }
    await recordAuditRepo(g.user, `comment.${status}`, 'comment', ids[0] ?? '', `${changed} moderated`);
    return ok({ changed }, 'live');
  } catch (e) {
    console.error('[api/admin/comments PATCH]', e);
    return err('comment-moderate-failed', 'Ntibyahindutse.', 'Could not moderate comment.');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    if (!id) return err('bad-request', 'id irakenewe.', 'id is required.', 400);
    const removed = await deleteCommentRepo(id);
    if (!removed) return err('not-found', 'Ibitekerezo ntibibonetse.', 'Comment not found.', 404);
    await recordAuditRepo(g.user, 'comment.delete', 'comment', id, 'deleted');
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/comments DELETE]', e);
    return err('comment-delete-failed', 'Ntisibwe.', 'Could not delete comment.');
  }
}
