/**
 * Author profiles (newsroom people + desks) — Postgres when configured, else
 * JSON (seeded with the same starter desks as migration 003).
 *
 * Reads use `SELECT *` + defensive mapping so an older schema (before
 * migration 004) still works: new columns simply come back empty.
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';
import { newId } from './backend.ts';

export interface Author {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  /** URL handle for /ibisobanuro/... author pages later. */
  slug?: string;
  email?: string;
  /** Beat/section the reporter covers (e.g. 'ubuhinzi'). */
  beat?: string;
  social?: { twitter?: string; linkedin?: string; whatsapp?: string };
  isActive?: boolean;
  /** Linked login account (role 'author' usually). */
  userId?: string;
  /** Newsroom stamp shown as the green “Verified” badge in the console. */
  verified?: boolean;
  createdAt: string;
}

const STORE = 'authors';

/** Mirror of the 003 seed rows (kept in sync manually). */
const SEED_DESKS: Author[] = [
  { id: 'desk-news', name: 'IbiheNews Desk', title: 'Central Desk', bio: 'Breaking and developing stories from Kigali and across Rwanda.', avatarUrl: '', slug: 'ibihenews-desk', beat: 'rwanda', verified: true, createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-agri', name: 'Agriculture & Markets Desk', title: 'Ubuhinzi n\u2019Isoko', bio: 'Farming, food prices and the rural economy.', avatarUrl: '', slug: 'ubuhinzi-isoko', beat: 'ubukungu', createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-business', name: 'Business & Economy Desk', title: 'Ubukungu', bio: 'Markets, business and economic policy.', avatarUrl: '', slug: 'ubukungu', beat: 'ubukungu', createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-verify', name: 'Verification Desk', title: 'Genagaciro', bio: 'Checks sources and verifies reports before publication.', avatarUrl: '', slug: 'genagaciro', beat: 'rwanda', verified: true, createdAt: '2026-09-12T00:00:00.000Z' },
];

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v ? v : fallback;
}

function rowToAuthor(r: Record<string, unknown>): Author {
  return {
    id: str(r.id),
    name: str(r.name),
    title: str(r.title),
    bio: str(r.bio),
    avatarUrl: str(r.avatar_url),
    ...(str(r.slug) ? { slug: str(r.slug) } : {}),
    ...(str(r.email) ? { email: str(r.email) } : {}),
    ...(str(r.beat) ? { beat: str(r.beat) } : {}),
    ...(r.social && typeof r.social === 'object' ? { social: r.social as Author['social'] } : {}),
    isActive: r.is_active === undefined ? true : Boolean(r.is_active),
    ...(str(r.user_id) ? { userId: str(r.user_id) } : {}),
    ...(r.verified === undefined ? {} : { verified: Boolean(r.verified) }),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
  };
}

export function newAuthorId(): string {
  return newId('a');
}

export function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function listAuthorsRepo(): Promise<Author[]> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<Record<string, unknown>>('SELECT * FROM authors ORDER BY created_at ASC LIMIT 200');
      if (r.rows.length === 0) return SEED_DESKS;
      const rows = r.rows.map(rowToAuthor);
      const seen = new Set(rows.map((a) => a.id));
      return [...rows, ...SEED_DESKS.filter((s) => !seen.has(s.id))];
    } catch (err) {
      console.error('[db] authors pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const stored = await readStore<Author[]>(STORE);
  if (!stored) {
    await writeStore(STORE, SEED_DESKS);
    return SEED_DESKS;
  }
  return stored.value;
}

/** Active-only listing for public UI (bylines, top authors, picker). */
export async function listPublicAuthorsRepo(): Promise<Author[]> {
  const all = await listAuthorsRepo();
  return all.filter((a) => a.isActive !== false);
}

export async function getAuthorRepo(id: string): Promise<Author | null> {
  const all = await listAuthorsRepo();
  return all.find((a) => a.id === id || a.slug === id) ?? null;
}

export async function upsertAuthorRepo(author: Author): Promise<void> {
  const withSlug: Author = { ...author, slug: author.slug || authorSlug(author.name) };
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO authors (id, name, title, bio, avatar_url, created_at, slug, email, beat, social, is_active, user_id, verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title,
           bio = EXCLUDED.bio, avatar_url = EXCLUDED.avatar_url, slug = EXCLUDED.slug,
           email = EXCLUDED.email, beat = EXCLUDED.beat, social = EXCLUDED.social,
           is_active = EXCLUDED.is_active, user_id = EXCLUDED.user_id, verified = EXCLUDED.verified`,
        [
          withSlug.id, withSlug.name, withSlug.title, withSlug.bio, withSlug.avatarUrl, withSlug.createdAt,
          withSlug.slug ?? null, withSlug.email ?? '', withSlug.beat ?? '',
          JSON.stringify(withSlug.social ?? {}), withSlug.isActive !== false, withSlug.userId ?? null,
          withSlug.verified === true,
        ],
      );
      return;
    } catch (err) {
      console.error('[db] authors pg upsert failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<Author[]>(STORE))?.value ?? SEED_DESKS;
  const byId = new Map(existing.map((a) => [a.id, a]));
  byId.set(withSlug.id, withSlug);
  await writeStore(STORE, [...byId.values()]);
}

export async function deleteAuthorRepo(id: string): Promise<boolean> {
  if (SEED_DESKS.some((a) => a.id === id)) {
    // Starter desks are metadata, not people: hide instead of removing.
    const found = await getAuthorRepo(id);
    if (!found) return false;
    await upsertAuthorRepo({ ...found, isActive: false });
    return true;
  }
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery('DELETE FROM authors WHERE id = $1', [id]);
      return (r.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[db] authors pg delete failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Author[]>(STORE))?.value ?? [];
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  await writeStore(STORE, next);
  return true;
}
