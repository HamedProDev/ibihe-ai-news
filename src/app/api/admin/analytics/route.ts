import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { analyticsSummaryRepo } from '@/lib/db/repos/events';
import { listArticlesRepo } from '@/lib/db/repos/articles';

/** Traffic/engagement series + the story leaderboard (?days=3..90). */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const days = Math.min(90, Math.max(3, Number(new URL(req.url).searchParams.get('days') ?? 14) || 14));
    const [summary, { items }] = await Promise.all([
      analyticsSummaryRepo(days),
      listArticlesRepo({ limit: 500 }),
    ]);
    const top = [...items]
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 12)
      .map((a) => ({
        id: a.id,
        title: a.title,
        titleKiny: a.titleKiny,
        category: a.category,
        views: a.views ?? 0,
        videos: a.videos?.length ?? 0,
        publishedAt: a.publishedAt,
      }));
    const byCategory = new Map<string, number>();
    for (const a of items) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + 1);
    const withVideo = items.filter((a) => (a.videos?.length ?? 0) > 0).length;
    return ok(
      {
        days,
        series: summary.days,
        totals: summary.totals,
        top,
        withVideo,
        totalStories: items.length,
        categories: [...byCategory.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
      },
      'live',
    );
  } catch (e) {
    console.error('[api/admin/analytics]', e);
    return err('analytics-failed', 'Imibare ntibibonetse.', 'Could not load analytics.');
  }
}
