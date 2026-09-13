import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { authorSlug, listAuthorsRepo, newAuthorId, upsertAuthorRepo, type Author } from '@/lib/db/repos/authors';
import { countArticlesByAuthorRepo } from '@/lib/db/repos/articles';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/** Author profiles + how many stories each has. */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const [items, counts] = await Promise.all([listAuthorsRepo(), countArticlesByAuthorRepo()]);
    return ok({ items: items.map((a) => ({ ...a, articleCount: counts[a.id] ?? 0 })), total: items.length }, 'live');
  } catch (e) {
    console.error('[api/admin/authors GET]', e);
    return err('authors-failed', 'Abanditsi ntibabonetse.', 'Could not load authors.');
  }
}

/** Create a profile. */
export async function POST(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const name = String(body?.name ?? '').trim().slice(0, 80);
    if (!name) return err('bad-request', 'Izina rirakenewe.', 'name is required.', 400);
    const author: Author = {
      id: newAuthorId(),
      name,
      title: String(body?.title ?? '').trim().slice(0, 80),
      bio: String(body?.bio ?? '').trim().slice(0, 1200),
      avatarUrl: String(body?.avatarUrl ?? '').trim().slice(0, 800),
      slug: authorSlug(name),
      ...(String(body?.email ?? '').trim() ? { email: String(body!.email).trim().slice(0, 120) } : {}),
      ...(String(body?.beat ?? '').trim() ? { beat: String(body!.beat).trim().slice(0, 30) } : {}),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await upsertAuthorRepo(author);
    await recordAuditRepo(g.user, 'author.create', 'author', author.id, author.name);
    return ok({ author }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/admin/authors POST]', e);
    return err('author-create-failed', 'Umwanditsi ntiyaremwe.', 'Could not create author.');
  }
}
