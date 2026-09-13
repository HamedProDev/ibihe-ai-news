import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import {
  deleteArticleRepo,
  listArticlesAdminRepo,
  setArticleFlagsRepo,
  upsertArticlesRepo,
} from '@/lib/db/repos/articles';
import { applyPatch, buildArticlePatch } from '@/lib/news/article-input';
import type { Article, NewsCategory } from '@/types/news';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/**
 * Console article listing.
 *   q, category, status, author, publishState, featured, breaking, video,
 *   tag, limit, offset, sort
 */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const flag = (k: string): boolean | undefined => {
      const v = sp.get(k);
      return v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : undefined;
    };
    const limit = Math.min(200, Math.max(1, Number(sp.get('limit') ?? 25) || 25));
    const offset = Math.max(0, Number(sp.get('offset') ?? 0) || 0);
    const sortRaw = sp.get('sort') ?? 'newest';
    const { items, total } = await listArticlesAdminRepo({
      q: (sp.get('q') ?? '').trim() || undefined,
      category: (sp.get('category') ?? 'all') as NewsCategory | 'all',
      status: (sp.get('status') ?? '').trim() || undefined,
      authorId: (sp.get('author') ?? '').trim() || undefined,
      tag: (sp.get('tag') ?? '').trim() || undefined,
      publishState: (sp.get('publishState') ?? 'all') as never,
      featured: flag('featured'),
      breaking: flag('breaking'),
      hasVideo: flag('video'),
      sort: sortRaw === 'views' || sortRaw === 'oldest' ? sortRaw : 'newest',
      limit,
      offset,
    });
    return ok({ items, total, limit, offset }, 'live');
  } catch (e) {
    console.error('[api/admin/articles GET]', e);
    return err('admin-list-failed', 'Inkuru ntizibonetse.', 'Could not list articles.');
  }
}

/** Create a story by hand. Every field of the Article type is accepted. */
export async function POST(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const actor = g.user?.email || g.user?.name || 'staff';
    const { errors, patch } = buildArticlePatch({ ...body, actor }, 'create');
    if (errors.length) {
      const first = errors[0];
      return err(first.code, first.messageKiny, first.messageEn, 400);
    }
    const now = new Date().toISOString();
    const article = applyPatch(
      {
        id: `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        title: '',
        titleKiny: '',
        excerpt: '',
        excerptKiny: '',
        category: 'amahanga' as NewsCategory,
        status: 'developing',
        sources: [],
        publishedAt: now,
        fetchedAt: now,
        entities: [],
        keyPointsKiny: [],
        keyPointsEn: [],
        tags: [],
        views: 0,
        isMock: false,
        country: 'RW',
        language: 'rw',
      } satisfies Article,
      patch,
    );
    article.publishedAt = patch.publishedAt ?? now;
    article.createdBy = actor;
    article.updatedBy = actor;
    article.updatedAt = now;
    await upsertArticlesRepo([article]);
    await recordAuditRepo(g.user, 'article.create', 'article', article.id, article.title.slice(0, 80));
    return ok({ article }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/admin/articles POST]', e);
    return err('admin-create-failed', 'Inkuru ntiyaremwe.', 'Could not create article.');
  }
}

/** Bulk actions: { ids: [], action: 'publish'|'draft'|'feature'|'unfeature'|'breaking'|'delete', value? } */
export async function PATCH(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { ids?: unknown; action?: unknown } | null;
    const ids = Array.isArray(body?.ids) ? (body!.ids as unknown[]).map((x) => String(x)).slice(0, 100) : [];
    const action = String(body?.action ?? '');
    if (!ids.length || !action) return err('bad-request', 'Ids na action birakenewe.', 'ids and action are required.', 400);
    if (!isAdminForBulk(g.user)) return err('forbidden', 'Ibi bisaba ubuyobozi.', 'Staff role required for bulk actions.', 403);

    let changed = 0;
    let deleted = 0;
    for (const id of ids) {
      if (action === 'delete') {
        if (await deleteArticleRepo(id)) deleted++;
        continue;
      }
      const patch: Partial<Article> = {};
      if (action === 'publish') patch.publishState = 'published';
      else if (action === 'draft') patch.publishState = 'draft';
      else if (action === 'archive') patch.publishState = 'archived';
      else if (action === 'feature') patch.featured = true;
      else if (action === 'unfeature') patch.featured = false;
      else if (action === 'breaking') patch.breaking = true;
      else if (action === 'unbreaking') patch.breaking = false;
      else return err('bad-action', 'Iki gikorwa ntikizwi.', 'Unknown bulk action.', 400);
      if (await setArticleFlagsRepo(id, patch, g.user?.email)) changed++;
    }
    await recordAuditRepo(g.user, `article.bulk.${action}`, 'article', ids[0] ?? '', `${changed + deleted} stories`);
    return ok({ changed, deleted }, 'live');
  } catch (e) {
    console.error('[api/admin/articles PATCH]', e);
    return err('admin-bulk-failed', 'Igikorwa nticyakunze.', 'Bulk action failed.');
  }
}

function isAdminForBulk(user: { role: string } | null): boolean {
  return user?.role === 'admin' || user?.role === 'author';
}
