import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireStaffAuth } from '@/lib/auth/session';
import { listArticlesRepo, upsertArticlesRepo } from '@/lib/db/repos/articles';
import type { Article, NewsCategory } from '@/types/news';
import type { ContentStatus } from '@/types/provenance';

const CATEGORIES: NewsCategory[] = [
  'ubuhinzi', 'politiki', 'ubukungu', 'ikoranabuhanga',
  'ubuzima', 'imikino', 'amahanga', 'imvurugano',
];
const STATUSES: ContentStatus[] = ['verified', 'developing', 'multi-source', 'analysis', 'forecast', 'opinion'];

/** Admin article list (stored rows only; supports q/limit/offset). */
export async function GET(req: NextRequest) {
  const admin = await requireStaffAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0);
    const { items } = await listArticlesRepo({ limit: 500 });
    const filtered = q
      ? items.filter((a) => `${a.title} ${a.titleKiny}`.toLowerCase().includes(q))
      : items;
    return ok({ items: filtered.slice(offset, offset + limit), total: filtered.length }, 'live');
  } catch (e) {
    console.error('[api/admin/articles GET]', e);
    return err('admin-list-failed', 'Inkuru ntizibonetse.', 'Could not list articles.');
  }
}

function asString(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** Create an article by hand (editorial content, fully human-authored). */
export async function POST(req: NextRequest) {
  const admin = await requireStaffAuth(req);
  if (!admin) {
    return err('unauthorized', 'Nta burenganzira. Injira nka admin.', 'Unauthorized. Sign in as admin.', 401);
  }
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const title = asString(body?.title, 300);
    const titleKiny = asString(body?.titleKiny, 300) || title;
    const excerpt = asString(body?.excerpt, 2000);
    const excerptKiny = asString(body?.excerptKiny, 2000) || excerpt;
    const category = (CATEGORIES as string[]).includes(String(body?.category))
      ? (body?.category as NewsCategory)
      : null;
    const status = (STATUSES as string[]).includes(String(body?.status))
      ? (body?.status as ContentStatus)
      : 'developing';
    if (!title || !excerpt || !category) {
      return err('bad-request', 'Umutwe, incamake n’icyiciro birakenewe.', 'Title, excerpt and category are required.', 400);
    }
    const now = new Date().toISOString();
    const sourceName = asString(body?.sourceName, 120) || 'Ibihe';
    const sourceUrl = asString(body?.sourceUrl, 1000);
    try {
      if (sourceUrl) new URL(sourceUrl);
    } catch {
      return err('bad-request', 'URL y’inkomoko ntago ariyo.', 'Invalid source URL.', 400);
    }
    const keyPointsKiny = Array.isArray(body?.keyPointsKiny)
      ? (body.keyPointsKiny as unknown[]).filter((x): x is string => typeof x === 'string').map((s) => s.slice(0, 500)).slice(0, 6)
      : [];
    const imageUrl = asString(body?.imageUrl, 1000);
    if (imageUrl) {
      try {
        const u = new URL(imageUrl);
        if (u.protocol !== 'https:') throw new Error('no-https');
      } catch {
        return err('bad-request', 'Ifoto igomba kuba HTTPS URL.', 'Image must be an HTTPS URL.', 400);
      }
    }
    const article: Article = {
      id: `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      titleKiny,
      excerpt,
      excerptKiny,
      category,
      status,
      sources: [{ name: sourceName, url: sourceUrl || 'https://ibihe.rw', publishedAt: now, fetchedAt: now }],
      ...(imageUrl ? { imageUrl } : {}),
      publishedAt: now,
      fetchedAt: now,
      entities: [],
      keyPointsKiny,
      keyPointsEn: [],
      tags: [],
      views: 0,
      isMock: false,
    };
    await upsertArticlesRepo([article]);
    return ok({ article }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/admin/articles POST]', e);
    return err('admin-create-failed', 'Inkuru ntiyaremwe.', 'Could not create article.');
  }
}
