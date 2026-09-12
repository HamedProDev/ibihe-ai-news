import { NextRequest } from 'next/server';
import { ok } from '@/lib/api/envelope';
import { clearSessionCookieHeader, endSession, readSessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  await endSession(readSessionToken(req)).catch(() => undefined);
  const res = ok({ loggedOut: true }, 'live');
  res.headers.set('Set-Cookie', clearSessionCookieHeader());
  return res;
}
