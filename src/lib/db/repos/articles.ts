/**
 * Article repository — Postgres when DATABASE_URL is set, JSON file store
 * otherwise. Callers never touch the backend directly.
 */
import type { Article, NewsCategory } from '../../../types/news';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'articles';
const RETENTION = 500;

export interface ArticleListOpts {
  category?: NewsCategory | 'all';
  limit?: number;
  offset?: number;
}

async function listJson(opts: ArticleListOpts): Promise<{ items: Article[]; total: number }> {
  const all = (await readStore<Article[]>(STORE))?.value ?? [];
  const filtered = !opts.category || opts.category === 'all' ? all : all.filter((a) => a.category === opts.category);
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 20;
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

async function listPg(opts: ArticleListOpts): Promise<{ items: Article[]; total: number }> {
  const limit = Math.min(500, opts.limit ?? 20);
  const offset = opts.offset ?? 0;
  const hasCat = opts.category && opts.category !== 'all';
  const where = hasCat ? 'WHERE category = $1' : '';
  const params: unknown[] = hasCat ? [opts.category] : [];
  const items = await pgQuery<{ data: Article }>(
    `SELECT data FROM articles ${where} ORDER BY published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const total = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM articles ${where}`, params);
  return { items: items.rows.map((r) => r.data), total: Number(total.rows[0]?.count ?? 0) };
}

export async function listArticlesRepo(opts: ArticleListOpts = {}): Promise<{ items: Article[]; total: number }> {
  if (isPostgresEnabled()) {
    try {
      return await listPg(opts);
    } catch (err) {
      console.error('[db] articles pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return listJson(opts);
}

export async function getArticleRepo(id: string): Promise<Article | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: Article }>('SELECT data FROM articles WHERE id = $1', [id]);
      if (r.rows[0]) return r.rows[0].data;
    } catch (err) {
      console.error('[db] articles pg get failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Article[]>(STORE))?.value ?? [];
  return all.find((a) => a.id === id) ?? null;
}

/**
 * Upsert many articles. First-seen (created_at) is preserved; the JSONB
 * document is replaced wholesale with the caller's version.
 */
export async function upsertArticlesRepo(articles: Article[]): Promise<void> {
  if (articles.length === 0) return;
  if (isPostgresEnabled()) {
    try {
      for (const a of articles) {
        await pgQuery(
          `INSERT INTO articles (id, category, status, published_at, fetched_at, is_mock, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             category = EXCLUDED.category, status = EXCLUDED.status,
             published_at = EXCLUDED.published_at, fetched_at = EXCLUDED.fetched_at,
             is_mock = EXCLUDED.is_mock, data = EXCLUDED.data, updated_at = now()`,
          [a.id, a.category, a.status, a.publishedAt, a.fetchedAt, a.isMock, JSON.stringify(a)],
        );
      }
      // Retention cap (keeps local installs small; production should archive).
      await pgQuery(
        `DELETE FROM articles WHERE id IN (
           SELECT id FROM articles ORDER BY published_at DESC OFFSET $1
         )`,
        [RETENTION],
      );
      return;
    } catch (err) {
      console.error('[db] articles pg upsert failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<Article[]>(STORE))?.value ?? [];
  const byId = new Map(existing.map((a) => [a.id, a]));
  for (const a of articles) byId.set(a.id, a);
  const all = [...byId.values()].sort((x, y) => +new Date(y.publishedAt) - +new Date(x.publishedAt));
  await writeStore(STORE, all.slice(0, RETENTION));
}

/** Full update of one article document (used by the review queue). */
export async function updateArticleRepo(article: Article): Promise<void> {
  await upsertArticlesRepo([article]);
}

/**
 * Delete one stored article (admin CRUD). Returns false when the id is not
 * a stored row (e.g. a built-in seed, which lives in code, not the DB).
 */
export async function deleteArticleRepo(id: string): Promise<boolean> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery('DELETE FROM articles WHERE id = $1', [id]);
      return (r.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[db] articles pg delete failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<Article[]>(STORE))?.value ?? [];
  const next = existing.filter((a) => a.id !== id);
  if (next.length === existing.length) return false;
  await writeStore(STORE, next);
  return true;
}

/**
 * Atomically bump the view counter. Best-effort: failures resolve to null
 * so article reads never break.
 */
export async function incrementArticleViewsRepo(id: string): Promise<number | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ views: number }>(
        `UPDATE articles
         SET data = jsonb_set(data, '{views}', to_jsonb(COALESCE((data->>'views')::int, 0) + 1)),
             updated_at = now()
         WHERE id = $1
         RETURNING (data->>'views')::int AS views`,
        [id],
      );
      return r.rows[0]?.views ?? null;
    } catch (err) {
      console.error('[db] articles pg view increment failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }
  try {
    const all = (await readStore<Article[]>(STORE))?.value ?? [];
    const art = all.find((a) => a.id === id);
    if (!art) return null;
    art.views = (art.views ?? 0) + 1;
    await writeStore(STORE, all);
    return art.views;
  } catch {
    return null;
  }
}

/** Count stored articles per author id (for bylines/top authors). */
export async function countArticlesByAuthorRepo(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    if (isPostgresEnabled()) {
      const r = await pgQuery<{ author_id: string; count: string }>(
        `SELECT data->>'authorId' AS author_id, COUNT(*)::text AS count
         FROM articles WHERE data->>'authorId' IS NOT NULL GROUP BY 1`,
      );
      for (const row of r.rows) counts[row.author_id] = Number(row.count);
      return counts;
    }
    const all = (await readStore<Article[]>(STORE))?.value ?? [];
    for (const a of all) {
      if (a.authorId) counts[a.authorId] = (counts[a.authorId] ?? 0) + 1;
    }
    return counts;
  } catch (err) {
    console.error('[db] count by author failed:', err instanceof Error ? err.message : err);
    return counts;
  }
}
