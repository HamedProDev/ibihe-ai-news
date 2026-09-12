import { NextRequest } from 'next/server';
import { listArticles } from '@/lib/news/store';
import { ok, err } from '@/lib/api/envelope';
import type { NewsCategory } from '@/types/news';

const CATEGORIES: Array<NewsCategory | 'all'> = [
  'all', 'ubuhinzi', 'politiki', 'ubukungu', 'ikoranabuhanga', 'ubuzima', 'imikino',
  'uburezi', 'umuco', 'ibidukikije', 'amahanga', 'imvurugano',
];
const TIMES = ['24h', '7d', '30d', 'all'] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCat = searchParams.get('category') ?? 'all';
    const category = (CATEGORIES.includes(rawCat as NewsCategory) ? rawCat : 'all') as NewsCategory | 'all';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
    const rawTime = searchParams.get('time') ?? 'all';
    const time = (TIMES as readonly string[]).includes(rawTime) ? (rawTime as (typeof TIMES)[number]) : 'all';
    const rawCountry = (searchParams.get('country') ?? 'all').trim().toUpperCase();
    const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : 'all';
    const sort = searchParams.get('sort') === 'views' ? 'views' : 'newest';

    const result = await listArticles({ category, limit, offset, time, country, sort });
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
