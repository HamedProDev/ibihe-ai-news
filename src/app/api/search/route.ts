import { NextRequest } from 'next/server';
import { allArticles } from '@/lib/news/store';
import { searchArticles } from '@/lib/news/search';
import { ok, err } from '@/lib/api/envelope';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim().slice(0, 200);
    if (q.length < 2) {
      return err('query-too-short', 'Andika inyuguti nibura ebyiri.', 'Type at least two characters.', 400);
    }
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const { articles, dataMode } = await allArticles();
    const hits = searchArticles(articles, q, limit);
    return ok({ query: q, hits: hits.map((h) => ({ article: h.article, score: h.score, matchedTerms: h.matchedTerms })), total: hits.length }, dataMode);
  } catch (e) {
    console.error('[api/search]', e);
    return err('search-failed', 'Ishakisha ntirikora. Ongera ugerageze.', 'Search unavailable. Please retry.');
  }
}
