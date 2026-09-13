import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';
import { createCommentRepo, listCommentsRepo } from '@/lib/db/repos/comments';
import { getSiteSettingsRepo } from '@/lib/db/repos/settings';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth/session';
import { recordEventRepo } from '@/lib/db/repos/events';

const LIMIT = { limit: 6, windowMs: 5 * 60_000 };

/** Approved comments for one story (newest first, flat). */
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const articleId = (sp.get('article') ?? '').trim();
    if (!articleId) return err('bad-request', 'article irakenewe.', 'article query param is required.', 400);
    const settings = await getSiteSettingsRepo();
    if (!settings.comments.enabled) return ok({ items: [], disabled: true }, 'live');
    const { items, total } = await listCommentsRepo({ articleId, status: 'approved', limit: 100 });
    return ok({ items, total, disabled: false }, 'live');
  } catch (e) {
    console.error('[api/comments GET]', e);
    return err('comments-failed', 'Ibitekerezo ntibibonetse.', 'Could not load comments.');
  }
}

/** Post a comment. Goes to the moderation queue unless auto-approve is on. */
export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'comment'), LIMIT);
  if (!verdict.allowed) {
    return err('rate-limited', 'Ukubye inshuro nyinshi. Tegereza.', 'Too many comments. Wait a bit.', 429);
  }
  try {
    const settings = await getSiteSettingsRepo();
    if (!settings.comments.enabled) return err('comments-closed', 'Ibitekerezo bifunze.', 'Comments are closed.', 403);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const articleId = String(body?.articleId ?? '').trim().slice(0, 80);
    const rawName = String(body?.name ?? '').trim().slice(0, 60);
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 120);
    const text = String(body?.body ?? '').trim();
    const language = String(body?.language ?? 'rw').slice(0, 4);
    if (!articleId || !text) return err('bad-request', 'Inkuru n’igitekerezo birakenewe.', 'articleId and body are required.', 400);
    if (text.length > settings.comments.maxLength) {
      return err('too-long', `Igitekerezo kirengeza inyuguti ${settings.comments.maxLength}.`, `Comment is longer than ${settings.comments.maxLength} characters.`, 400);
    }
    const blocked = settings.comments.blockedWords.filter((w) => w && text.toLowerCase().includes(w.toLowerCase()));
    if (blocked.length) return err('blocked', 'Ibitekerezo birimo amagambo atemewe.', 'Comment contains blocked words.', 422);

    const session = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
    const name = session?.user.name || rawName || (session ? session.user.email.split('@')[0] : 'Umomasomeshi');

    const created = await createCommentRepo({
      articleId,
      ...(session ? { userId: session.user.id } : {}),
      authorName: name,
      authorEmail: session?.user.email ?? email,
      body: text,
      language,
      status: settings.comments.autoApprove || session?.user.role === 'admin' ? 'approved' : 'pending',
    });
    await recordEventRepo('comment_post', articleId, { status: created.status });
    return ok(
      {
        id: created.id,
        status: created.status,
        message:
          created.status === 'approved'
            ? { rw: 'Igitekerezo cyanyuze.', en: 'Your comment is live.' }
            : { rw: 'Kirimo kugenzurwa n’abapima.', en: 'Thanks — your comment is awaiting moderation.' },
      },
      'live',
      { status: 201 },
    );
  } catch (e) {
    console.error('[api/comments POST]', e);
    return err('comment-failed', 'Igitekerezo nticyoherejwe.', 'Could not post comment.');
  }
}
