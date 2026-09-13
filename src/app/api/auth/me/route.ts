import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { getSessionUser, readSessionToken } from '@/lib/auth/session';

/** Current session user (powers header auth state + admin auto-unlock). */
export async function GET(req: NextRequest) {
  try {
    const info = await getSessionUser(readSessionToken(req));
    if (!info) return err('unauthorized', 'Ntawe winjiye.', 'Not signed in.', 401);
    return ok({ user: info.user }, 'live');
  } catch (e) {
    console.error('[api/auth/me]', e);
    return err('me-failed', 'Ntibashoboye kumenya uwinjiye.', 'Could not load session.');
  }
}
