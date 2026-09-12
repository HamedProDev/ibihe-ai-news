import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireStaffAuth } from '@/lib/auth/session';
import { deleteArticleRepo, getArticleRepo, upsertArticlesRepo } from '@/lib/db/repos/articles';
import type { NewsCategory } from '@/types/news';
import type { ContentStatus } from '@/types/provenance';

const CATEGORIES = new Set([
  'ubuhinzi', 'politiki', 'ubukungu', 'ikoranabuhanga',
  'ubuzima', 'imikino', 'amahanga', 'imvurugano',
]);
const STATUSES = new Set(['verified', 'developing', 'multi-source', 'analysis', 'forecast', 'opinion']);

async function guard(req: NextRequest) {
  const admin = await requireStaffAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  return null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const article = await getArticleRepo(id);
    if (!article) return err('not-found', 'Inkuru ntibonetse.', 'Article not found.', 404);
    return ok({ article }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] GET]', e);
    return err('admin-get-failed', 'Inkuru ntibonetse.', 'Could not load article.');
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await getArticleRepo(id);
    if (!existing) return err('not-found', 'Inkuru ntibonetse.', 'Article not found.', 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);

    const str = (v: unknown, max: number): string | undefined =>
      typeof v === 'string' ? v.trim().slice(0, max) : undefined;
    const next = { ...existing };
    const title = str(body.title, 300);
    const excerpt = str(body.excerpt, 2000);
    if (title !== undefined) {
      if (!title) return err('bad-request', 'Umutwe ntushobora kuba ubusa.', 'Title cannot be empty.', 400);
      next.title = title;
    }
    const titleKiny = str(body.titleKiny, 300);
    if (titleKiny !== undefined) next.titleKiny = titleKiny || next.title;
    if (excerpt !== undefined) {
      if (!excerpt) return err('bad-request', 'Incamake ntishobora kuba ubusa.', 'Excerpt cannot be empty.', 400);
      next.excerpt = excerpt;
    }
    const excerptKiny = str(body.excerptKiny, 2000);
    if (excerptKiny !== undefined) next.excerptKiny = excerptKiny || next.excerpt;
    if (typeof body.category === 'string') {
      if (!CATEGORIES.has(body.category)) return err('bad-request', 'Icyiciro ntago aribyo.', 'Invalid category.', 400);
      next.category = body.category as NewsCategory;
    }
    if (typeof body.status === 'string') {
      if (!STATUSES.has(body.status)) return err('bad-request', 'Imiterere ntago ariyo.', 'Invalid status.', 400);
      next.status = body.status as ContentStatus;
    }
    if (Array.isArray(body.keyPointsKiny)) {
      next.keyPointsKiny = (body.keyPointsKiny as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.slice(0, 500))
        .slice(0, 6);
    }
    if (body.imageUrl !== undefined) {
      const imageUrl = str(body.imageUrl, 1000) ?? '';
      if (imageUrl) {
        try {
          const u = new URL(imageUrl);
          if (u.protocol !== 'https:') throw new Error('no-https');
        } catch {
          return err('bad-request', 'Ifoto igomba kuba HTTPS URL.', 'Image must be an HTTPS URL.', 400);
        }
        next.imageUrl = imageUrl;
      } else {
        delete next.imageUrl;
      }
    }
    await upsertArticlesRepo([next]);
    return ok({ article: next }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] PUT]', e);
    return err('admin-update-failed', 'Inkuru ntivuguruwe.', 'Could not update article.');
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const deleted = await deleteArticleRepo(id);
    if (!deleted) {
      return err('not-found', 'Inkuru ntibonetse (inkuru zubatse muri code ntzisibwa).', 'Article not found (built-in stories cannot be deleted).', 404);
    }
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] DELETE]', e);
    return err('admin-delete-failed', 'Inkuru ntisibwe.', 'Could not delete article.');
  }
}
