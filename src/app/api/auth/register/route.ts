import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import { countUsersRepo, createUserRepo, newUserId, publicUser } from '@/lib/db/repos/users';
import { sessionCookieHeader, startSession } from '@/lib/auth/session';

const LIMIT = { limit: 10, windowMs: 60_000 };

/**
 * Create an account. The FIRST registered user becomes admin (bootstrap);
 * everyone after is a regular user. Rate-limited per IP.
 */
export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'auth-register'), LIMIT);
  if (!verdict.allowed) {
    const res = err('rate-limited', 'Mugerageje inshuro nyinshi. Tegereza gato.', 'Too many attempts. Wait a moment.', 429);
    res.headers.set('Retry-After', String(Math.ceil(verdict.retryAfterMs / 1000)));
    return res;
  }
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown; name?: unknown; locale?: unknown } | null;
    const emailErr = validateEmail(body?.email);
    if (emailErr) return err('bad-email', 'Imeri ntago ariyo.', emailErr, 400);
    const passErr = validatePassword(body?.password);
    if (passErr) {
      return err(
        'bad-password',
        'Ijambobanga rigomba kuba byibuze inyuguti 8.',
        passErr,
        400,
      );
    }
    const email = (body?.email as string).trim().toLowerCase();
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const rawLocale = typeof body?.locale === 'string' ? body.locale : 'rw';
    const locale = ['rw', 'en', 'fr', 'sw'].includes(rawLocale) ? rawLocale : 'rw';
    const total = await countUsersRepo();
    const user = {
      id: newUserId(),
      email,
      name,
      passwordHash: await hashPassword(body?.password as string),
      role: (total === 0 ? 'admin' : 'user') as 'admin' | 'author' | 'user',
      locale,
      createdAt: new Date().toISOString(),
    };
    try {
      await createUserRepo(user);
    } catch (e) {
      if (e instanceof Error && e.message === 'email-taken') {
        return err('email-taken', 'Iyi imeri irasanzwe ikoreshwa. Injira aho kugira konti.', 'Email already registered. Try logging in.', 409);
      }
      throw e;
    }
    const { token, expiresAt } = await startSession(user.id);
    const res = ok({ user: publicUser(user) }, 'live', { status: 201 });
    res.headers.set('Set-Cookie', sessionCookieHeader(token, expiresAt));
    return res;
  } catch (e) {
    console.error('[api/auth/register]', e);
    return err('register-failed', 'Konti ntayikozwe. Ongera ugerageze.', 'Registration failed. Please retry.');
  }
}
