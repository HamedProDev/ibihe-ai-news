/**
 * Users + sessions repository — Postgres when configured, else JSON.
 * Session tokens are stored as SHA-256 hashes (a DB read never leaks
 * a usable cookie).
 */
import { createHash, randomBytes } from 'node:crypto';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
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
  createdAt: string;
}

const USERS_STORE = 'users';
const SESSIONS_STORE = 'sessions';

export function publicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
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
  id: string; email: string; name: string; password_hash: string; role: string; created_at: string;
}): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    passwordHash: r.password_hash,
    role: r.role === 'admin' ? 'admin' : 'user',
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
        id: string; email: string; name: string; password_hash: string; role: string; created_at: string;
      }>('SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = $1', [norm]);
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
        id: string; email: string; name: string; password_hash: string; role: string; created_at: string;
      }>('SELECT id, email, name, password_hash, role, created_at FROM users WHERE id = $1', [id]);
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
        `INSERT INTO users (id, email, name, password_hash, role, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [norm.id, norm.email, norm.name, norm.passwordHash, norm.role, norm.createdAt],
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
