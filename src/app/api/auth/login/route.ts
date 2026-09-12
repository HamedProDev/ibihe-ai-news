import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';
import { verifyPassword } from '@/lib/auth/password';
import { findUserByEmailRepo, publicUser } from '@/lib/db/repos/users';
import { sessionCookieHeader, startSession } from '@/lib/auth/session';

const LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'auth-login'), LIMIT);
  if (!verdict.allowed) {
    const res = err('rate-limited', 'Mugerageje inshuro nyinshi. Tegereza gato.', 'Too many attempts. Wait a moment.', 429);
    res.headers.set('Retry-After', String(Math.ceil(verdict.retryAfterMs / 1000)));
    return res;
  }
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password) {
      return err('bad-request', 'Imeri n’ijambobanga birakenewe.', 'Email and password are required.', 400);
    }
    const user = await findUserByEmailRepo(email);
    // Same message either way: never reveal whether an email is registered.
    const fail = () =>
      err('invalid-credentials', 'Imeri cyangwa ijambobanga ntago aribyo.', 'Invalid email or password.', 401);
    if (!user) return fail();
    if (!(await verifyPassword(password, user.passwordHash))) return fail();
    const { token, expiresAt } = await startSession(user.id);
    const res = ok({ user: publicUser(user) }, 'live');
    res.headers.set('Set-Cookie', sessionCookieHeader(token, expiresAt));
    return res;
  } catch (e) {
    console.error('[api/auth/login]', e);
    return err('login-failed', 'Kwinjira byananiranye. Ongera ugerageze.', 'Login failed. Please retry.');
  }
}
