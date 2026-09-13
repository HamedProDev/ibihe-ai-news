import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import { createUserRepo, listUsersRepo, newUserId, publicUser } from '@/lib/db/repos/users';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import { recordAuditRepo } from '@/lib/db/repos/audit';
import type { UserRole } from '@/lib/db/repos/users';

const ROLES = new Set<UserRole>(['admin', 'author', 'user']);

/** Everyone with an account, plus live session counts. */
export async function GET(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const items = await listUsersRepo({
      q: (sp.get('q') ?? '').trim() || undefined,
      role: (sp.get('role') ?? 'all').trim(),
    });
    return ok({ items, total: items.length }, 'live');
  } catch (e) {
    console.error('[api/admin/users GET]', e);
    return err('users-failed', 'Abakoresha ntibabonetse.', 'Could not load users.');
  }
}

/** Create a staff account (the console can invite journalists directly). */
export async function POST(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const emailErr = validateEmail(body?.email);
    if (emailErr) return err('bad-email', 'Imeri ntago ariyo.', emailErr, 400);
    const password = String(body?.password ?? '');
    const passErr = validatePassword(password);
    if (passErr) return err('bad-password', 'Ijambobanga ridafite ubukana.', passErr, 400);
    const role = String(body?.role ?? 'user') as UserRole;
    if (!ROLES.has(role)) return err('bad-role', 'Uruhare ntiruzwi.', 'Unknown role.', 400);
    const user = {
      id: newUserId(),
      email: String(body!.email as string).trim().toLowerCase(),
      name: String(body?.name ?? '').trim().slice(0, 80),
      passwordHash: await hashPassword(password),
      role,
      locale: ['rw', 'en', 'fr', 'sw'].includes(String(body?.locale)) ? String(body?.locale) : 'rw',
      createdAt: new Date().toISOString(),
      ...(String(body?.jobTitle ?? '') ? { jobTitle: String(body?.jobTitle).slice(0, 80) } : {}),
    };
    try {
      await createUserRepo(user);
    } catch (e) {
      if (e instanceof Error && e.message === 'email-taken') {
        return err('email-taken', 'Iyi imeri irasanzwe ikoreshwa.', 'Email already registered.', 409);
      }
      throw e;
    }
    await recordAuditRepo(g.user, 'user.create', 'user', user.id, `${user.email} as ${role}`);
    return ok({ user: publicUser(user) }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/admin/users POST]', e);
    return err('user-create-failed', 'Konti ntiyaremwe.', 'Could not create user.');
  }
}
