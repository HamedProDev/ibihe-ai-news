import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { articleStatsRepo, listArticlesAdminRepo, listArticlesRepo } from '@/lib/db/repos/articles';
import { countCommentsByStatusRepo } from '@/lib/db/repos/comments';
import { countTipsByStatusRepo } from '@/lib/db/repos/engage';
import { countSubscribersRepo } from '@/lib/db/repos/engage';
import { countMediaRepo } from '@/lib/db/repos/media';
import { listReviewsRepo } from '@/lib/db/repos/reviews';
import { analyticsSummaryRepo } from '@/lib/db/repos/events';
import { listAuditRepo } from '@/lib/db/repos/audit';
import { getSiteSettingsRepo } from '@/lib/db/repos/settings';
import { listAuthorsRepo } from '@/lib/db/repos/authors';
import { listUsersRepo } from '@/lib/db/repos/users';
import { PROVINCES, provinceOf } from '@/lib/news/rwanda';
import { canonicalCategory } from '@/lib/news/category-registry';
import { readIngestMeta } from '@/lib/news/store';
import { dbBackend } from '@/lib/db/postgres';
import type { Article } from '@/types/news';

const DAY = 86_400_000;

function pct(now: number, prev: number): number {
  if (prev <= 0) return now > 0 ? 100 : 0;
  return Math.round(((now - prev) / prev) * 100);
}

function within(a: Article, from: number, to: number): boolean {
  const t = +new Date(a.publishedAt || a.fetchedAt);
  return Number.isFinite(t) && t >= from && t < to;
}

/**
 * Everything the console home screen shows, in one call: headline stats,
 * trends for the metric cards, 14-day traffic series, category/province
 * distribution, the story table, the right-rail widgets and ops metadata.
 */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const isAdmin = g.user?.role === 'admin';
    const [
      stats, drafts, scheduled, comments, tips, subscribers, media, review, summary,
      audit, settings, ingestMeta, corpus, authors,
    ] = await Promise.all([
      articleStatsRepo(),
      listArticlesAdminRepo({ publishState: 'draft', limit: 6 }),
      listArticlesAdminRepo({ publishState: 'scheduled', limit: 6 }),
      countCommentsByStatusRepo(),
      countTipsByStatusRepo(),
      countSubscribersRepo().catch(() => 0),
      countMediaRepo(),
      listReviewsRepo('pending').catch(() => []),
      analyticsSummaryRepo(14),
      listAuditRepo({ limit: 8 }),
      getSiteSettingsRepo(),
      readIngestMeta().catch(() => null),
      listArticlesRepo({ limit: 500 }).then((r) => r.items).catch(() => [] as Article[]),
      listAuthorsRepo().catch(() => []),
    ]);

    let { items: recent } = await listArticlesAdminRepo({ limit: 8 });

    // Demo deployments: the public site serves DEMO_ARTICLES while the store
    // is empty, so the console mirrors those same stories instead of zeros.
    const demoMode = corpus.length === 0;
    const rows: Article[] = demoMode
      ? (await import('@/lib/news/demo-seeds.ts')).DEMO_ARTICLES
      : corpus;

    let dashStats = stats;
    if (demoMode) {
      const byCat = new Map<string, number>();
      const out: typeof stats = {
        total: 0, published: 0, draft: 0, scheduled: 0, archived: 0, breaking: 0,
        featured: 0, withVideo: 0, withGallery: 0, totalViews: 0, byCategory: [],
      };
      for (const a of rows) {
        const st = a.publishState ?? 'published';
        out.total++;
        if (st === 'published') out.published++;
        else if (st === 'draft') out.draft++;
        else if (st === 'scheduled') out.scheduled++;
        else if (st === 'archived') out.archived++;
        if (a.breaking) out.breaking++;
        if (a.featured) out.featured++;
        if ((a.videos?.length ?? 0) > 0) out.withVideo++;
        if ((a.gallery?.length ?? 0) > 0) out.withGallery++;
        out.totalViews += a.views ?? 0;
        byCat.set(a.category, (byCat.get(a.category) ?? 0) + 1);
      }
      out.byCategory = [...byCat.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
      dashStats = out;
      if (recent.length === 0) {
        recent = [...rows].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).slice(0, 8);
      }
    }

    // ---- trends for the metric cards (last 7 days vs the 7 before) --------
    const now = Date.now();
    const [w1, w2] = [now - 7 * DAY, now - 14 * DAY];
    const articles7d = rows.filter((a) => within(a, w1, now + DAY)).length;
    const articlesPrev = rows.filter((a) => within(a, w2, w1)).length;
    const published7d = rows.filter((a) => (a.publishState ?? 'published') === 'published' && within(a, w1, now + DAY)).length;
    const publishedPrev = rows.filter((a) => (a.publishState ?? 'published') === 'published' && within(a, w2, w1)).length;
    const viewsSeries = summary.days;
    const sum = (rows: { views: number }[], n: number, fromEnd: number) =>
      rows.slice(Math.max(0, rows.length - fromEnd - n), rows.length > fromEnd ? rows.length - fromEnd : 0).reduce((x, r) => x + r.views, 0);
    const views7d = sum(viewsSeries, 7, 0);
    const viewsPrev7 = sum(viewsSeries, 7, 7);
    const authorsCount = new Set(rows.map((a) => a.authorId || a.authorName).filter(Boolean)).size;
    const trends = {
      articles: pct(articles7d, articlesPrev),
      published: pct(published7d, publishedPrev),
      // The pending queue is tracked, not chased — no fake trend.
      pending: 0,
      views: pct(views7d, viewsPrev7),
    };

    // ---- distribution by Rwandan province (from story districts) ---------
    const provinceCounts = PROVINCES.map((p) => ({ code: p.code, label: p.en, labelRw: p.rw, mark: p.mark, color: p.color, count: 0 }));
    let located = 0;
    for (const a of rows) {
      const code = provinceOf(a.district);
      if (!code) continue;
      const row = provinceCounts.find((x) => x.code === code);
      if (row) {
        row.count++;
        located++;
      }
    }
    provinceCounts.sort((a, b) => b.count - a.count);

    // ---- top authors (tally stories, enrich with the desk profile) -------
    const byAuthor = new Map<string, { key: string; name: string; count: number; views: number }>();
    for (const a of rows) {
      const key = a.authorId || a.authorName || '';
      if (!key) continue;
      const row = byAuthor.get(key) ?? { key, name: a.authorName || key, count: 0, views: 0 };
      row.count++;
      row.views += a.views ?? 0;
      byAuthor.set(key, row);
    }
    const topAuthors = [...byAuthor.values()]
      .sort((a, b) => b.count - a.count || b.views - a.views)
      .slice(0, 5)
      .map((row) => {
        const profile = authors.find((x) => x.id === row.key || x.name === row.key || x.slug === row.key);
        return {
          name: profile?.name || row.name,
          title: profile?.title || '',
          verified: Boolean(profile?.verified),
          avatarUrl: profile?.avatarUrl || '',
          stories: row.count,
          views: row.views,
        };
      });

    // ---- recent registrations (admin eyes only) ---------------------------
    const recentUsers = isAdmin
      ? (await listUsersRepo({ limit: 5 })).slice(0, 5).map((u) => ({
          name: u.name || u.email,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt ?? null,
        }))
      : [];

    return ok(
      {
        stats: {
          ...dashStats,
          byCategory: dashStats.byCategory.map((row) => ({ ...row, category: canonicalCategory(row.category) })),
        },
        drafts: drafts.items.slice(0, 5),
        draftCount: drafts.total,
        scheduled: scheduled.items.slice(0, 5),
        scheduledCount: scheduled.total,
        recent,
        comments,
        tips,
        subscribers,
        media,
        reviewPending: review.length,
        series: summary.days.map((d) => ({ day: d.day, views: d.views, videoPlays: d.videoPlays })),
        totals: summary.totals,
        trends,
        locatedStories: located,
        byProvince: provinceCounts,
        topAuthors,
        recentUsers,
        authorCount: Math.max(authorsCount, authors.filter((a) => a.isActive !== false).length),
        audit,
        backend: dbBackend(),
        maintenance: settings.maintenance.enabled,
        ingestion: ingestMeta
          ? {
              lastRunAt: ingestMeta.lastRunAt,
              lastSuccessAt: ingestMeta.lastSuccessAt,
              totalStored: ingestMeta.totalStored,
              addedLastRun: ingestMeta.addedLastRun,
              errors: ingestMeta.errors?.length ?? 0,
            }
          : null,
      },
      'live',
    );
  } catch (e) {
    console.error('[api/admin/dashboard]', e);
    return err('dashboard-failed', 'Imibare y’ubuyobozi ntibibonetse.', 'Could not load the dashboard.');
  }
}
