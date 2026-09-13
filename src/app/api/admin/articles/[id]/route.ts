import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { deleteArticleRepo, getArticleRepo, setArticleFlagsRepo, upsertArticlesRepo } from '@/lib/db/repos/articles';
import { applyPatch, buildArticlePatch } from '@/lib/news/article-input';
import { recordAuditRepo } from '@/lib/db/repos/audit';
import type { Article } from '@/types/news';

/** Read one story for the editor (drafts included). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
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

/** Update any part of the story (title, body, videos, media, SEO, flags…). */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const existing = await getArticleRepo(id);
    if (!existing) return err('not-found', 'Inkuru ntibonetse.', 'Article not found.', 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);

    const actor = g.user?.email || 'staff';
    const { errors, patch } = buildArticlePatch({ ...body, actor }, 'update');
    if (errors.length) {
      const first = errors[0];
      return err(first.code, first.messageKiny, first.messageEn, 400);
    }
    // An editor may not silently rewrite provenance of feed rows they did not touch.
    const next: Article = applyPatch(existing, {
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    });
    if (body.publishedAt === undefined) next.publishedAt = existing.publishedAt;
    await upsertArticlesRepo([next]);
    await recordAuditRepo(g.user, 'article.update', 'article', next.id, next.title.slice(0, 80));
    return ok({ article: next }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] PUT]', e);
    return err('admin-update-failed', 'Inkuru ntivuguruwe.', 'Could not update article.');
  }
}

/** Quick flags used by list rows (feature / break / publish / hide). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Partial<Article> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const allowed = ['featured', 'breaking', 'pinned', 'allowComments', 'publishState', 'visibility', 'sponsored', 'premium'] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (body[key] !== undefined) patch[key] = body[key];
    if (!Object.keys(patch).length) return err('bad-request', 'Nta mpinduka zoherejwe.', 'No allowed fields in body.', 400);
    const updated = await setArticleFlagsRepo(id, patch as never, g.user?.email);
    if (!updated) return err('not-found', 'Inkuru ntibonetse.', 'Article not found.', 404);
    await recordAuditRepo(g.user, 'article.flags', 'article', id, Object.keys(patch).join(','));
    return ok({ article: updated }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] PATCH]', e);
    return err('admin-flags-failed', 'Ibimenyetso ntibyahinduwe.', 'Could not update flags.');
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const deleted = await deleteArticleRepo(id);
    if (!deleted) {
      return err(
        'not-found',
        'Inkuru ntibonetse (inkuru zubatse muri code ntisibwa).',
        'Article not found (built-in stories cannot be deleted).',
        404,
      );
    }
    await recordAuditRepo(g.user, 'article.delete', 'article', id, 'deleted');
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/articles/[id] DELETE]', e);
    return err('admin-delete-failed', 'Inkuru ntisibwe.', 'Could not delete article.');
  }
}
