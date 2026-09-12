import { allArticles } from '@/lib/news/store';
import { buildBriefing } from '@/lib/news/briefing';
import { getBriefingRepo } from '@/lib/db/repos/briefings';
import { dayKey } from '@/lib/briefing/worker';
import { ok, err } from '@/lib/api/envelope';

export async function GET() {
  try {
    // Serve the stored daily briefing when the scheduler has built it.
    const stored = await getBriefingRepo(dayKey()).catch(() => null);
    if (stored && Array.isArray((stored as { bullets?: unknown }).bullets)) {
      return ok(stored, 'live');
    }
    const { articles, dataMode } = await allArticles();
    return ok(buildBriefing(articles), dataMode);
  } catch (e) {
    console.error('[api/briefing]', e);
    return err('briefing-failed', 'Incamake ntibonetse.', 'Briefing unavailable.');
  }
}
