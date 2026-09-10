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
