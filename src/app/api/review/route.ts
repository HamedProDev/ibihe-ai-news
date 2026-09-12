import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireAdminAuth } from '@/lib/auth/session';
import { decideReviewRepo, getReviewRepo, listReviewsRepo } from '@/lib/db/repos/reviews';
import { updateArticleRepo } from '@/lib/db/repos/articles';
import { getArticle } from '@/lib/news/store';
import { applyReviewToArticle } from '@/lib/review/apply';
import type { ReviewDecision, ReviewStatus } from '@/lib/review/types';

/** List review items (admin only). */
export async function GET(req: NextRequest) {
  // Admin session cookie OR legacy ADMIN_SECRET bearer.
  const admin = await requireAdminAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('status') ?? 'pending';
    const status = raw === 'all' ? 'all' : (['pending', 'approved', 'edited', 'flagged'].includes(raw) ? raw : 'pending');
    const items = await listReviewsRepo(status as ReviewStatus | 'all');
    return ok({ items, total: items.length }, 'live');
  } catch (e) {
    console.error('[api/review GET]', e);
    return err('review-failed', 'Review ntibonetse.', 'Review queue unavailable.');
  }
}

const STATUS_OF: Record<ReviewDecision, ReviewStatus> = { approve: 'approved', edit: 'edited', flag: 'flagged' };

/** Decide on a review item (admin only). Applies approved/edited values to the article. */
export async function POST(req: NextRequest) {
  // Admin session cookie OR legacy ADMIN_SECRET bearer.
  const admin = await requireAdminAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      id?: unknown; decision?: unknown; editedRaw?: unknown; note?: unknown; reviewer?: unknown;
    } | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    const decision = body?.decision as ReviewDecision | undefined;
    if (!id || !['approve', 'edit', 'flag'].includes(decision ?? '')) {
      return err('bad-request', 'Icyifuzo nticyuzuye.', 'Missing id or invalid decision.', 400);
    }
    const item = await getReviewRepo(id);
    if (!item) return err('not-found', 'Ntibibonetse.', 'Review item not found.', 404);
    if (item.status !== 'pending') {
      return err('already-decided', 'Icyi cyamaze gufatwa icyemezo.', 'Already decided.', 409);
    }

    const editedRaw = typeof body?.editedRaw === 'string' ? body.editedRaw.slice(0, 4000) : undefined;
    if (decision === 'edit' && !editedRaw?.trim()) {
      return err('bad-request', 'Andika ibyahinduwe.', 'Edited text is required for edit decisions.', 400);
    }

    // Apply to the article (no-op for flag). Resolved through the merged
    // read path so reviews on seed articles work too (stored copy wins).
    if (decision === 'approve' || decision === 'edit') {
      const { article } = await getArticle(item.refId);
      if (article) {
        const next = applyReviewToArticle(article, item, { decision, editedRaw });
        await updateArticleRepo(next);
      }
    }

    const decidedAt = new Date().toISOString();
    const updated = await decideReviewRepo(id, {
      status: STATUS_OF[decision as ReviewDecision],
      decidedBy:
        typeof body?.reviewer === 'string' && body.reviewer
          ? body.reviewer.slice(0, 80)
          : admin.email || admin.name || 'admin-token',
      decidedAt,
      decisionNote: typeof body?.note === 'string' ? body.note.slice(0, 500) : '',
      proposedRw: decision === 'edit' ? editedRaw : undefined,
    });
    return ok({ item: updated }, 'live');
  } catch (e) {
    console.error('[api/review POST]', e);
    return err('review-failed', 'Icyemezo nticyafashwe.', 'Decision failed.');
  }
}
