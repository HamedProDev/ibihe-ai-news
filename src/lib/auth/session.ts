/**
 * Session cookies + request guards (server-only).
 *
 * - Cookie `ibihe_session` holds an opaque token; the DB stores its hash.
 * - Admin routes accept EITHER a valid admin session cookie OR the legacy
 *   ADMIN_SECRET bearer (keeps scripts working during the migration).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin } from '../api/auth.ts';
import {
  createSessionRepo,
  deleteSessionRepo,
  findUserByIdRepo,
  getSessionRepo,
  hashToken,
  newSessionToken,
  publicUser,
  purgeExpiredSessionsRepo,
  type PublicUser,
} from '../db/repos/users.ts';

export const SESSION_COOKIE = 'ibihe_session';
export const SESSION_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days

export interface SessionInfo {
  user: PublicUser;
  expiresAt: string;
}

export async function startSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = newSessionToken();
  const now = Date.now();
  await createSessionRepo({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    createdAt: new Date(now).toISOString(),
  });
  // Opportunistic cleanup; never blocks login.
  purgeExpiredSessionsRepo().catch(() => undefined);
  return { token, expiresAt: new Date(now + SESSION_TTL_MS).toISOString() };
}

export async function endSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await deleteSessionRepo(hashToken(token));
}

export function readSessionToken(req: Pick<NextRequest, 'cookies'>): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export async function getSessionUser(token: string | undefined): Promise<SessionInfo | null> {
  if (!token || token.length < 32) return null;
  const session = await getSessionRepo(hashToken(token));
  if (!session) return null;
  if (session.expiresAt < new Date().toISOString()) {
    await deleteSessionRepo(session.tokenHash).catch(() => undefined);
    return null;
  }
  const user = await findUserByIdRepo(session.userId);
  if (!user) return null;
  return { user: publicUser(user), expiresAt: session.expiresAt };
}

/** Admin gate: valid admin session cookie OR legacy ADMIN_SECRET bearer. */
export async function requireAdminAuth(req: NextRequest): Promise<PublicUser | null> {
  const info = await getSessionUser(readSessionToken(req));
  if (info && info.user.role === 'admin') return info.user;
  if (requireAdmin(req)) {
    return { id: 'token', email: '', name: 'API token', role: 'admin', createdAt: '' };
  }
  return null;
}

export function sessionCookieHeader(token: string, expiresAt: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
