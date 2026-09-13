import { NextRequest } from 'next/server';
import { getArticle } from '@/lib/news/store';
import { buildWhyItMatters } from '@/lib/news/why-matters';
import { ok, err } from '@/lib/api/envelope';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getArticle(id);
    if (!result.article) {
      return err('not-found', 'Iyi nkuru ntibonetse.', 'Article not found.', 404);
    }
    return ok(
      {
        article: result.article,
        related: result.related,
        cluster: result.cluster,
        whyItMatters: buildWhyItMatters(result.article),
      },
      result.dataMode,
    );
  } catch (e) {
    console.error('[api/articles]', e);
    return err('article-failed', 'Inkuru ntibonetse. Ongera ugerageze.', 'Article unavailable. Please retry.');
  }
}
