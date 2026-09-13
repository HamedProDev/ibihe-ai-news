/**
 * Users + sessions repository — Postgres when configured, else JSON.
 * Session tokens are stored as SHA-256 hashes (a DB read never leaks
 * a usable cookie).
 */
import { createHash, randomBytes } from 'node:crypto';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export type UserRole = 'admin' | 'author' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  /** Primary UI language (rw|en|fr|sw|ar|ha). */
  locale: string;
  createdAt: string;
  /** Newsroom profile extras (migration 004; optional on older schemas). */
  avatarUrl?: string;
  jobTitle?: string;
  bio?: string;
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface Session {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locale: string;
  createdAt: string;
  avatarUrl?: string;
  jobTitle?: string;
  bio?: string;
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

const USERS_STORE = 'users';
const SESSIONS_STORE = 'sessions';

export function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    locale: u.locale || 'rw',
    createdAt: u.createdAt,
    ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
    ...(u.jobTitle ? { jobTitle: u.jobTitle } : {}),
    ...(u.bio ? { bio: u.bio } : {}),
    ...(u.phone ? { phone: u.phone } : {}),
    isActive: u.isActive !== false,
    ...(u.lastLoginAt ? { lastLoginAt: u.lastLoginAt } : {}),
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newUserId(): string {
  return `u-${randomBytes(8).toString('hex')}`;
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function rowToUser(r: {
  id: string; email: string; name: string; password_hash: string; role: string; locale?: string; created_at: string;
}): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    passwordHash: r.password_hash,
    role: r.role === 'admin' ? 'admin' : r.role === 'author' ? 'author' : 'user',
    locale: r.locale || 'rw',
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function countUsersRepo(): Promise<number> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
      return Number(r.rows[0]?.count ?? 0);
    } catch (err) {
      console.error('[db] users pg count failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return ((await readStore<User[]>(USERS_STORE))?.value ?? []).length;
}

export async function findUserByEmailRepo(email: string): Promise<User | null> {
  const norm = email.trim().toLowerCase();
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{
        id: string; email: string; name: string; password_hash: string; role: string; locale: string; created_at: string;
      }>('SELECT id, email, name, password_hash, role, locale, created_at FROM users WHERE email = $1', [norm]);
      return r.rows[0] ? rowToUser(r.rows[0]) : null;
    } catch (err) {
      console.error('[db] users pg find failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  return all.find((u) => u.email === norm) ?? null;
}

export async function findUserByIdRepo(id: string): Promise<User | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{
        id: string; email: string; name: string; password_hash: string; role: string; locale: string; created_at: string;
      }>('SELECT id, email, name, password_hash, role, locale, created_at FROM users WHERE id = $1', [id]);
      return r.rows[0] ? rowToUser(r.rows[0]) : null;
    } catch (err) {
      console.error('[db] users pg find failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  return all.find((u) => u.id === id) ?? null;
}

export async function createUserRepo(user: User): Promise<void> {
  const norm = { ...user, email: user.email.trim().toLowerCase() };
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO users (id, email, name, password_hash, role, locale, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [norm.id, norm.email, norm.name, norm.passwordHash, norm.role, norm.locale || 'rw', norm.createdAt],
      );
      return;
    } catch (err) {
      // Unique violation (23505) means "email taken" — surface it cleanly.
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
        throw new Error('email-taken');
      }
      console.error('[db] users pg create failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  if (all.some((u) => u.email === norm.email)) throw new Error('email-taken');
  await writeStore(USERS_STORE, [...all, norm].slice(-5000));
}

export async function createSessionRepo(session: Session): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES ($1,$2,$3,$4)`,
        [session.tokenHash, session.userId, session.expiresAt, session.createdAt],
      );
      return;
    } catch (err) {
      console.error('[db] sessions pg create failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
  await writeStore(SESSIONS_STORE, [...all, session].slice(-5000));
}

export async function getSessionRepo(tokenHash: string): Promise<Session | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ token_hash: string; user_id: string; expires_at: string; created_at: string }>(
        'SELECT token_hash, user_id, expires_at, created_at FROM sessions WHERE token_hash = $1',
        [tokenHash],
      );
      const row = r.rows[0];
      if (!row) return null;
      return {
        tokenHash: row.token_hash,
        userId: row.user_id,
        expiresAt: new Date(row.expires_at).toISOString(),
        createdAt: new Date(row.created_at).toISOString(),
      };
    } catch (err) {
      console.error('[db] sessions pg get failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
  return all.find((s) => s.tokenHash === tokenHash) ?? null;
}

export async function deleteSessionRepo(tokenHash: string): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
      return;
    } catch (err) {
      console.error('[db] sessions pg delete failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
  await writeStore(SESSIONS_STORE, all.filter((s) => s.tokenHash !== tokenHash));
}

/** Best-effort expiry sweep (called opportunistically on login). */
export async function purgeExpiredSessionsRepo(nowIso?: string): Promise<void> {
  const now = nowIso ?? new Date().toISOString();
  if (isPostgresEnabled()) {
    try {
      await pgQuery('DELETE FROM sessions WHERE expires_at < $1', [now]);
      return;
    } catch {
      /* fall through to json */
    }
  }
  const all = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
  const fresh = all.filter((s) => s.expiresAt >= now);
  if (fresh.length !== all.length) await writeStore(SESSIONS_STORE, fresh);
}

/** Persist the user's preferred UI language. Returns false if unknown id. */
export async function updateUserLocaleRepo(id: string, locale: string): Promise<boolean> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ id: string }>('UPDATE users SET locale = $2 WHERE id = $1 RETURNING id', [id, locale]);
      if (r.rows[0]) return true;
    } catch (err) {
      console.error('[db] users pg locale update failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  try {
    const users = (await readStore<User[]>(USERS_STORE))?.value ?? [];
    const u = users.find((x) => x.id === id);
    if (!u) return false;
    u.locale = locale;
    await writeStore(USERS_STORE, users);
    return true;
  } catch {
    return false;
  }
}


/* ------------------------------------------------------------------ *
 * Console administration (migration 004 columns; SELECT * keeps older *
 * schemas working).                                                    *
 * ------------------------------------------------------------------ */

export interface UserAdminRow extends PublicUser {
  /** Number of live sessions (helps "sign out everywhere"). */
  sessions: number;
}

export async function listUsersRepo(opts: { q?: string; role?: string; limit?: number } = {}): Promise<UserAdminRow[]> {
  const limit = Math.min(500, opts.limit ?? 200);
  let users: User[] = [];
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<Record<string, unknown>>('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
      users = r.rows.map((x) => rowFromAny(x));
    } catch (err) {
      console.error('[db] users pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  if (!users.length) users = (await readStore<User[]>(USERS_STORE))?.value ?? [];

  let sessionsByUser: Record<string, number> = {};
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ user_id: string; count: string }>(
        'SELECT user_id, COUNT(*)::text AS count FROM sessions WHERE expires_at > now() GROUP BY user_id',
      );
      sessionsByUser = Object.fromEntries(r.rows.map((x) => [x.user_id, Number(x.count)]));
    } catch {
      /* sessions count is cosmetic */
    }
  } else {
    const sessions = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
    const now = new Date().toISOString();
    for (const s of sessions) if (s.expiresAt > now) sessionsByUser[s.userId] = (sessionsByUser[s.userId] ?? 0) + 1;
  }

  const q = (opts.q ?? '').trim().toLowerCase();
  return users
    .filter((u) => (opts.role && opts.role !== 'all' ? u.role === opts.role : true))
    .filter((u) => (q ? `${u.name} ${u.email}`.toLowerCase().includes(q) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({ ...publicUser(u), sessions: sessionsByUser[u.id] ?? 0 }));
}

function rowFromAny(r: Record<string, unknown>): User {
  const role = String(r.role ?? 'user');
  return {
    id: String(r.id),
    email: String(r.email ?? ''),
    name: String(r.name ?? ''),
    passwordHash: String(r.password_hash ?? ''),
    role: (role === 'admin' ? 'admin' : role === 'author' ? 'author' : 'user') as UserRole,
    locale: String(r.locale || 'rw'),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
    ...(typeof r.avatar_url === 'string' && r.avatar_url ? { avatarUrl: r.avatar_url } : {}),
    ...(typeof r.job_title === 'string' && r.job_title ? { jobTitle: r.job_title } : {}),
    ...(typeof r.bio === 'string' && r.bio ? { bio: r.bio } : {}),
    ...(typeof r.phone === 'string' && r.phone ? { phone: r.phone } : {}),
    ...(r.is_active === undefined ? {} : { isActive: Boolean(r.is_active) }),
    ...(r.last_login_at ? { lastLoginAt: new Date(String(r.last_login_at)).toISOString() } : {}),
  };
}

export async function updateUserProfileRepo(
  id: string,
  patch: Partial<Pick<User, 'name' | 'role' | 'locale' | 'avatarUrl' | 'jobTitle' | 'bio' | 'phone' | 'isActive' | 'lastLoginAt'>>,
): Promise<User | null> {
  const before = await findUserByIdRepo(id);
  if (!before) return null;
  const next: User = { ...before, ...patch };
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `UPDATE users SET name = $2, role = $3, locale = $4, avatar_url = $5, job_title = $6, bio = $7,
           phone = $8, is_active = $9, last_login_at = $10
         WHERE id = $1`,
        [
          next.id, next.name, next.role, next.locale || 'rw', next.avatarUrl ?? '', next.jobTitle ?? '',
          next.bio ?? '', next.phone ?? '', next.isActive !== false, next.lastLoginAt ?? null,
        ],
      );
      return next;
    } catch (err) {
      console.error('[db] users pg update failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  const idx = all.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  all[idx] = next;
  await writeStore(USERS_STORE, all);
  return next;
}

/** Record a successful sign-in (dashboard shows "last seen"). */
export async function touchUserLoginRepo(id: string): Promise<void> {
  await updateUserProfileRepo(id, { lastLoginAt: new Date().toISOString() }).catch(() => undefined);
}

/** Revoke every session of one user (role change, deactivation). */
export async function revokeUserSessionsRepo(id: string): Promise<number> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery('DELETE FROM sessions WHERE user_id = $1', [id]);
      return r.rowCount ?? 0;
    } catch (err) {
      console.error('[db] sessions pg revoke failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Session[]>(SESSIONS_STORE))?.value ?? [];
  const next = all.filter((s) => s.userId !== id);
  await writeStore(SESSIONS_STORE, next);
  return all.length - next.length;
}

/** Set a new password from the console (admin reset). */
export async function setUserPasswordRepo(id: string, passwordHash: string): Promise<boolean> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery('UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id', [id, passwordHash]);
      if (r.rows[0]) return true;
    } catch (err) {
      console.error('[db] users pg password failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  const u = all.find((x) => x.id === id);
  if (!u) return false;
  u.passwordHash = passwordHash;
  await writeStore(USERS_STORE, all);
  return true;
}

export async function deleteUserRepo(id: string): Promise<boolean> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery('DELETE FROM sessions WHERE user_id = $1', [id]);
      const r = await pgQuery('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      return (r.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[db] users pg delete failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<User[]>(USERS_STORE))?.value ?? [];
  const next = all.filter((u) => u.id !== id);
  if (next.length === all.length) return false;
  await writeStore(USERS_STORE, next);
  await revokeUserSessionsRepo(id);
  return true;
}
