import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { articleStatsRepo } from '@/lib/db/repos/articles';
import { countCommentsByStatusRepo } from '@/lib/db/repos/comments';
import { countTipsByStatusRepo, countSubscribersRepo } from '@/lib/db/repos/engage';
import { countMediaRepo } from '@/lib/db/repos/media';
import { countUsersRepo } from '@/lib/db/repos/users';
import { listReviewsRepo } from '@/lib/db/repos/reviews';

/** Tiny payload for the sidebar badges + header bell (fast, polled on nav). */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const [stats, comments, tips, media, users, review] = await Promise.all([
      articleStatsRepo(),
      countCommentsByStatusRepo().catch(() => ({ pending: 0, approved: 0 })),
      countTipsByStatusRepo().catch(() => ({ new: 0, investigating: 0 })),
      countMediaRepo().catch(() => 0),
      countUsersRepo().catch(() => 0),
      listReviewsRepo('pending').catch(() => []),
    ]);
    void countSubscribersRepo;
    return ok(
      {
        pending: stats.draft + stats.scheduled,
        review: review.length,
        comments: comments.pending,
        tips: (tips.new ?? 0) + (tips.investigating ?? 0),
        media,
        users,
      },
      'live',
    );
  } catch (e) {
    console.error('[api/admin/nav-counts]', e);
    return err('nav-counts-failed', 'Imibare ntibonetse.', 'Could not load badge counts.', 500);
  }
}
