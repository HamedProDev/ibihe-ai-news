import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { createSubscriberRepo } from '@/lib/db/repos/engage';
import { isLocale } from '@/lib/i18n/dictionaries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** POST: newsletter signup { email, locale? }. Idempotent. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; locale?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email) || email.length > 160) {
      return err('bad-email', 'Imeri ntago ariyo.', 'Invalid email address.', 400);
    }
    const locale = isLocale(body?.locale) ? (body.locale as string) : 'rw';
    const result = await createSubscriberRepo({ email, locale, createdAt: new Date().toISOString() });
    return ok({ subscribed: true, exists: result === 'exists' }, 'live');
  } catch (e) {
    console.error('[api/newsletter]', e);
    return err('newsletter-failed', 'Kwiyandikisha byanze.', 'Signup failed. Please retry.');
  }
}
