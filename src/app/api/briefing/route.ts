import { allArticles } from '@/lib/news/store';
import { buildBriefing } from '@/lib/news/briefing';
import { ok, err } from '@/lib/api/envelope';

export async function GET() {
  try {
    const { articles, dataMode } = await allArticles();
    return ok(buildBriefing(articles), dataMode);
  } catch (e) {
    console.error('[api/briefing]', e);
    return err('briefing-failed', 'Incamake ntibonetse.', 'Briefing unavailable.');
  }
}
