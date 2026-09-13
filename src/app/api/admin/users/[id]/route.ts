import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import {
  deleteUserRepo,
  findUserByIdRepo,
  publicUser,
  revokeUserSessionsRepo,
  setUserPasswordRepo,
  updateUserProfileRepo,
  type UserRole,
} from '@/lib/db/repos/users';
import { validatePassword } from '@/lib/auth/password';
import { recordAuditRepo } from '@/lib/db/repos/audit';

const ROLES = new Set<UserRole>(['admin', 'author', 'user']);

/** Change role / active flag / profile fields / password reset. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const target = await findUserByIdRepo(id);
    if (!target) return err('not-found', 'Ukoresha ntibonetse.', 'User not found.', 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);

    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 80);
    if (typeof body.locale === 'string' && ['rw', 'en', 'fr', 'sw'].includes(body.locale)) patch.locale = body.locale;
    for (const key of ['avatarUrl', 'jobTitle', 'bio', 'phone'] as const) {
      if (typeof body[key] === 'string') patch[key] = (body[key] as string).trim().slice(0, key === 'bio' ? 600 : 160);
    }
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
    if (body.role !== undefined) {
      const role = String(body.role) as UserRole;
      if (!ROLES.has(role)) return err('bad-role', 'Uruhare ntiruzwi.', 'Unknown role.', 400);
      if (role !== 'admin' && target.id === g.user?.id) {
        return err('self-demotion', 'Ntushobora kwimikura ubwawe.', 'You cannot remove your own admin role.', 400);
      }
      patch.role = role;
    }
    const updated = await updateUserProfileRepo(id, patch as never);
    if (!updated) return err('save-failed', 'Ntibyabitswe.', 'Could not save changes.');

    // Role / activation changes always sign the user out everywhere.
    let sessionsRevoked = 0;

    if (patch.role !== undefined || patch.isActive === false) sessionsRevoked = await revokeUserSessionsRepo(id);

    if (body.revoke === true) {
      sessionsRevoked += await revokeUserSessionsRepo(id);
    }

    if (typeof body.password === 'string' && body.password) {
      const passErr = validatePassword(body.password);
      if (passErr) return err('bad-password', 'Ijambobanga ridafite ubukana.', passErr, 400);
      const { hashPassword } = await import('@/lib/auth/password');
      await setUserPasswordRepo(id, await hashPassword(body.password));
      sessionsRevoked += await revokeUserSessionsRepo(id);
    }

    await recordAuditRepo(g.user, 'user.update', 'user', id, Object.keys(patch).join(','));
    return ok({ user: publicUser(updated), sessionsRevoked }, 'live');
  } catch (e) {
    console.error('[api/admin/users/[id] PUT]', e);
    return err('user-update-failed', 'Ntibyavuguruwe.', 'Could not update user.');
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    if (id === g.user?.id) return err('self-delete', 'Ntishobora kwisiba.', 'You cannot delete your own account.', 400);
    const removed = await deleteUserRepo(id);
    if (!removed) return err('not-found', 'Ukoresha ntibonetse.', 'User not found.', 404);
    await recordAuditRepo(g.user, 'user.delete', 'user', id, 'deleted');
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/users/[id] DELETE]', e);
    return err('user-delete-failed', 'Ntisibwe.', 'Could not delete user.');
  }
}
