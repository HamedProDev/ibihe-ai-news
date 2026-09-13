import { listAuthorsRepo } from '@/lib/db/repos/authors';
import { countArticlesByAuthorRepo } from '@/lib/db/repos/articles';
import { ok, err } from '@/lib/api/envelope';

/** GET: newsroom desks + staff authors with published-story counts. */
export async function GET() {
  try {
    const [authors, counts] = await Promise.all([listAuthorsRepo(), countArticlesByAuthorRepo()]);
    const withCounts = [...authors]
      .map((a) => ({ ...a, articleCount: counts[a.id] ?? 0 }))
      .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
    return ok({ authors: withCounts }, 'live');
  } catch (e) {
    console.error('[api/authors]', e);
    return err('authors-failed', 'Abanditsi ntabonetse.', 'Authors unavailable.');
  }
}
