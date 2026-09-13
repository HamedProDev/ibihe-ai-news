/**
 * Daily AI briefing worker (server-only).
 *
 * Every morning the scheduler calls /api/cron/briefing, which runs
 * ensureDailyBriefing(): read the day's stored articles, extractively rank
 * the top bullets (no invented facts — bullets are key points from real
 * rows), and persist one briefing per UTC day. The homepage and /api/briefing
 * serve the stored copy so readers always see the same daily summary.
 */
import { getBriefingRepo, saveBriefingRepo } from '../db/repos/briefings.ts';
import { listArticlesRepo } from '../db/repos/articles.ts';
import { buildBriefing, type DailyBriefing } from '../news/briefing.ts';

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function ensureDailyBriefing(day: string = dayKey()): Promise<{ briefing: DailyBriefing; stored: boolean }> {
  const existing = await getBriefingRepo(day).catch(() => null);
  if (existing && Array.isArray((existing as { bullets?: unknown }).bullets)) {
    return { briefing: existing as unknown as DailyBriefing, stored: false };
  }
  const { items } = await listArticlesRepo({ limit: 500 });
  const briefing = buildBriefing(items, 6);
  briefing.date = day;
  await saveBriefingRepo(day, briefing as unknown as Record<string, unknown>);
  return { briefing, stored: true };
}
