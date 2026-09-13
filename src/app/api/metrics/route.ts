import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';
import { recordEventRepo, type EventType } from '@/lib/db/repos/events';

const TYPES = new Set<EventType>([
  'article_view', 'video_play', 'search', 'newsletter_signup', 'tip_submit', 'comment_post', 'save', 'share', 'outbound_click',
]);
const LIMIT = { limit: 60, windowMs: 60_000 };

/**
 * Client-side analytics beacon (fire-and-forget). Counts stay on the server;
 * the dashboard reads them back through /api/admin/analytics.
 */
export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'metrics'), LIMIT);
  if (!verdict.allowed) return err('rate-limited', 'Nyinshi.', 'Too many events.', 429);
  try {
    const body = (await req.json().catch(() => null)) as { type?: unknown; refId?: unknown; meta?: unknown } | null;
    const type = String(body?.type ?? '') as EventType;
    if (!TYPES.has(type)) return err('bad-type', 'Ubwoko ntibuzwi.', 'Unknown event type.', 400);
    const refId = String(body?.refId ?? '').slice(0, 80);
    const meta = body?.meta && typeof body.meta === 'object' ? (body.meta as Record<string, unknown>) : {};
    await recordEventRepo(type, refId, meta);
    return ok({ recorded: true }, 'live', { status: 202 });
  } catch (e) {
    console.error('[api/metrics]', e);
    return err('metric-failed', 'Ntibyabitswe.', 'Could not record event.');
  }
}
