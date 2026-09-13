import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { createTipRepo } from '@/lib/db/repos/engage';

function rid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** POST: reader news tip { message, contact?, name?, kind? }. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      message?: unknown; contact?: unknown; name?: unknown; kind?: unknown;
    } | null;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (message.length < 10 || message.length > 2000) {
      return err('bad-message', 'Ubutumwa bugomba kuba hagati y’inyuguti 10 na 2000.', 'Message must be 10–2000 characters.', 400);
    }
    const contact = typeof body?.contact === 'string' ? body.contact.trim().slice(0, 120) : '';
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const rawKind = typeof body?.kind === 'string' ? body.kind : 'news';
    const kind = ['news', 'photo', 'video', 'other'].includes(rawKind) ? rawKind : 'news';
    await createTipRepo({ id: rid(), kind, name, contact, message, createdAt: new Date().toISOString() });
    return ok({ received: true }, 'live');
  } catch (e) {
    console.error('[api/tips]', e);
    return err('tip-failed', 'Kohereza byanze.', 'Submission failed. Please retry.');
  }
}
