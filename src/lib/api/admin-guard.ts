/**
 * Guards shared by every /api/admin/* route handler.
 *
 * Two levels:
 *  • staff = admin or author session (or the ADMIN_SECRET bearer) → write
 *    stories, media, briefing.
 *  • admin = admin session only → settings, users, moderation, categories.
 *
 * A denied request returns a ready-to-send response, so handlers stay short:
 *   const g = await needStaff(req); if (g.res) return g.res;
 */
import type { NextRequest, NextResponse } from 'next/server';
import { err } from './envelope.ts';
import { requireAdminAuth, requireStaffAuth } from '../auth/session.ts';
import type { PublicUser } from '../db/repos/users.ts';

export interface Guard {
  user: PublicUser | null;
  res: NextResponse | null;
}

export async function needStaff(req: NextRequest): Promise<Guard> {
  const user = await requireStaffAuth(req);
  if (user) return { user, res: null };
  return {
    user: null,
    res: err('unauthorized', 'Nta burenganzira. Injira nk’umunyamakuru cyangwa admin.', 'Sign in as an author or admin.', 401),
  };
}

export async function needAdmin(req: NextRequest): Promise<Guard> {
  const user = await requireAdminAuth(req);
  if (user) return { user, res: null };
  return {
    user: null,
    res: err('forbidden', 'Ibi bisaba ubuyobozi (admin).', 'Admin role required.', 403),
  };
}

/** True when the caller is an admin (used to widen author permissions). */
export function isAdmin(user: PublicUser | null): boolean {
  return user?.role === 'admin';
}
