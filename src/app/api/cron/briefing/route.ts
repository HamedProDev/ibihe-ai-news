import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { requireCron } from '@/lib/api/auth';
import { dayKey, ensureDailyBriefing } from '@/lib/briefing/worker';

/**
 * Scheduler trigger: build + store today's AI briefing from the day's news.
 * Protected by CRON_SECRET (Vercel Cron sends it automatically).
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return err('cron-disabled', 'Cron ntirikora.', 'Scheduler is not configured.', 503);
  }
  if (!requireCron(req)) {
    return err('unauthorized', 'Nta burenganzira.', 'Unauthorized.', 401);
  }
  try {
    const day = dayKey();
    const { briefing, stored } = await ensureDailyBriefing(day);
    return ok({ day, bullets: briefing.bullets.length, articles: briefing.articleCount, stored }, 'live');
  } catch (e) {
    console.error('[api/cron/briefing]', e);
    return err('briefing-cron-failed', 'Incamake yananiwe.', 'Briefing build failed.');
  }
}
