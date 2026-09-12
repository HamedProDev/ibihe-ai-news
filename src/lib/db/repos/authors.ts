/**
 * Author profiles — Postgres when configured, else JSON (seeded with the
 * same starter desks as migration 003).
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export interface Author {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
}

const STORE = 'authors';

/** Mirror of the 003 seed rows (kept in sync manually). */
const SEED_DESKS: Author[] = [
  { id: 'desk-news', name: 'IbiheNews Desk', title: 'Central Desk', bio: 'Breaking and developing stories from Rwanda and across Africa.', avatarUrl: '', createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-agri', name: 'Agriculture & Markets Desk', title: 'Ubuhinzi n\u2019Isoko', bio: 'Farming, food prices and the rural economy.', avatarUrl: '', createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-business', name: 'Business & Economy Desk', title: 'Ubukungu', bio: 'Markets, business and economic policy.', avatarUrl: '', createdAt: '2026-09-12T00:00:00.000Z' },
  { id: 'desk-verify', name: 'Verification Desk', title: 'Genagaciro', bio: 'Checks sources and verifies reports before publication.', avatarUrl: '', createdAt: '2026-09-12T00:00:00.000Z' },
];

function rowToAuthor(r: { id: string; name: string; title: string; bio: string; avatar_url: string; created_at: string }): Author {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    bio: r.bio,
    avatarUrl: r.avatar_url,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function listAuthorsRepo(): Promise<Author[]> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ id: string; name: string; title: string; bio: string; avatar_url: string; created_at: string }>(
        'SELECT id, name, title, bio, avatar_url, created_at FROM authors ORDER BY created_at ASC LIMIT 100',
      );
      return r.rows.map(rowToAuthor);
    } catch (err) {
      console.error('[db] authors pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const stored = (await readStore<Author[]>(STORE))?.value;
  if (!stored) {
    await writeStore(STORE, SEED_DESKS);
    return SEED_DESKS;
  }
  return stored;
}

export async function getAuthorRepo(id: string): Promise<Author | null> {
  const all = await listAuthorsRepo();
  return all.find((a) => a.id === id) ?? null;
}

export async function upsertAuthorRepo(author: Author): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO authors (id, name, title, bio, avatar_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title,
           bio = EXCLUDED.bio, avatar_url = EXCLUDED.avatar_url`,
        [author.id, author.name, author.title, author.bio, author.avatarUrl, author.createdAt],
      );
      return;
    } catch (err) {
      console.error('[db] authors pg upsert failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<Author[]>(STORE))?.value ?? SEED_DESKS;
  const byId = new Map(existing.map((a) => [a.id, a]));
  byId.set(author.id, author);
  await writeStore(STORE, [...byId.values()]);
}
