import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { incrementArticleViewsRepo } from '@/lib/db/repos/articles';

/** POST: count one read. Best-effort — never fails the article page. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return err('bad-id', 'ID ntibabonetse.', 'Missing id.', 400);
    const views = await incrementArticleViewsRepo(id);
    return ok({ id, views }, 'live');
  } catch (e) {
    console.error('[api/articles/view]', e);
    return ok({ views: null }, 'live');
  }
}
