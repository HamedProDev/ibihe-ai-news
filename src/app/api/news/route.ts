import { NextRequest } from 'next/server';
import { listArticles } from '@/lib/news/store';
import { ok, err } from '@/lib/api/envelope';
import { CATEGORY_ALIASES, CATEGORY_SLUGS } from '@/lib/news/category-registry';
import type { NewsCategory } from '@/types/news';

const TIMES = ['24h', '7d', '30d', 'all'] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCat = searchParams.get('category') ?? 'all';
    // Current slugs pass through; legacy slugs (ubuhinzi…) resolve to their
    // Rwanda-first successor; anything else falls back to the full feed.
    const category: NewsCategory | 'all' =
      rawCat === 'all' || (CATEGORY_SLUGS as string[]).includes(rawCat)
        ? (rawCat as NewsCategory | 'all')
        : (CATEGORY_ALIASES[rawCat.toLowerCase()] as NewsCategory | undefined) ?? 'all';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
    const rawTime = searchParams.get('time') ?? 'all';
    const time = (TIMES as readonly string[]).includes(rawTime) ? (rawTime as (typeof TIMES)[number]) : 'all';
    const rawCountry = (searchParams.get('country') ?? 'all').trim().toUpperCase();
    const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : 'all';
    const rawSort = searchParams.get('sort') ?? 'newest';
    const sort = rawSort === 'views' || rawSort === 'oldest' ? rawSort : 'newest';
    const flag = (key: string): boolean | undefined => {
      const v = searchParams.get(key);
      return v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : undefined;
    };
    const tag = (searchParams.get('tag') ?? '').trim().toLowerCase() || undefined;
    const status = (searchParams.get('status') ?? '').trim() || undefined;
    const authorId = (searchParams.get('author') ?? '').trim() || undefined;
    const q = (searchParams.get('q') ?? '').trim() || undefined;

    const result = await listArticles({
      category, limit, offset, time, country, sort,
      featured: flag('featured'), breaking: flag('breaking'), hasVideo: flag('video'),
      tag, status, authorId, q,
    });
    // New envelope + legacy top-level fields (deprecated, kept for old clients).
    const res = ok(
      {
        articles: result.articles,
        clusters: result.clusters,
        total: result.total,
        ingestMeta: result.ingestMeta,
        articles_legacy: result.articles,
      },
      result.dataMode,
    );
    const body = await res.json();
    return Response.json({ ...body, articles: result.articles, total: result.total });
  } catch (e) {
    console.error('[api/news]', e);
    return err('news-failed', 'Amakuru ntabonetse. Ongera ugerageze.', 'News unavailable. Please retry.');
  }
}
