/**
 * Article repository — Postgres when DATABASE_URL is set, JSON file store
 * otherwise. Callers never touch the backend directly.
 *
 * The whole record lives in the JSONB `data` column (the TypeScript type is
 * the contract); the flat columns exist purely so listings/filters can be
 * answered with an index instead of loading documents.
 */
import type { Article, NewsCategory, PublishState } from '../../../types/news';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'articles';
const RETENTION = 500;

export interface ArticleListOpts {
  category?: NewsCategory | 'all';
  limit?: number;
  offset?: number;
  /** Only articles published within the window. */
  time?: '24h' | '7d' | '30d' | 'all';
  country?: string;
  sort?: 'newest' | 'views' | 'oldest';
  status?: string;
  authorId?: string;
  tag?: string;
  featured?: boolean;
  breaking?: boolean;
  hasVideo?: boolean;
  /** Case-insensitive substring over title/excerpt/tags. */
  q?: string;
  /** Admin listings may include drafts/archived rows. */
  includeUnpublished?: boolean;
  publishState?: PublishState | 'all';
}

const TIME_WINDOW_MS: Record<'24h' | '7d' | '30d', number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

/** Is this story safe to show in a public listing right now? */
export function isPubliclyListed(a: Article, now = Date.now()): boolean {
  const state = a.publishState ?? 'published';
  if (state === 'draft' || state === 'archived') return false;
  if (a.visibility === 'unlisted') return false;
  if (state === 'scheduled') {
    const when = new Date(a.publishedAt).getTime();
    if (Number.isFinite(when) && when > now) return false;
  }
  return true;
}

function matchesJson(a: Article, opts: ArticleListOpts, now: number): boolean {
  if (!opts.includeUnpublished && !isPubliclyListed(a, now)) return false;
  if (opts.includeUnpublished && opts.publishState && opts.publishState !== 'all') {
    if ((a.publishState ?? 'published') !== opts.publishState) return false;
  }
  if (opts.category && opts.category !== 'all' && a.category !== opts.category) return false;
  if (opts.status && a.status !== opts.status) return false;
  if (opts.authorId && a.authorId !== opts.authorId) return false;
  if (opts.tag && !(a.tags ?? []).some((t) => t.toLowerCase() === opts.tag!.toLowerCase())) return false;
  if (opts.featured !== undefined && Boolean(a.featured) !== opts.featured) return false;
  if (opts.breaking !== undefined && Boolean(a.breaking) !== opts.breaking) return false;
  if (opts.hasVideo !== undefined && (a.videos?.length ?? 0) > 0 !== opts.hasVideo) return false;
  if (opts.country && opts.country !== 'all') {
    if ((a.country ?? 'RW').toUpperCase() !== opts.country.toUpperCase()) return false;
  }
  if (opts.time && opts.time !== 'all') {
    const t = new Date(a.publishedAt || a.fetchedAt).getTime();
    if (!Number.isFinite(t) || t < now - TIME_WINDOW_MS[opts.time]) return false;
  }
  if (opts.q) {
    const hay = `${a.title} ${a.titleKiny} ${a.excerpt} ${a.excerptKiny} ${(a.tags ?? []).join(' ')}`.toLowerCase();
    if (!hay.includes(opts.q.toLowerCase())) return false;
  }
  return true;
}

function sortJson(items: Article[], sort: ArticleListOpts['sort']): Article[] {
  if (sort === 'views') {
    return [...items].sort(
      (a, b) => (b.views ?? 0) - (a.views ?? 0) || +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
  }
  if (sort === 'oldest') return [...items].sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
  return [...items].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

async function listJson(opts: ArticleListOpts): Promise<{ items: Article[]; total: number }> {
  const now = Date.now();
  const all = (await readStore<Article[]>(STORE))?.value ?? [];
  const filtered = sortJson(all.filter((a) => matchesJson(a, opts, now)), opts.sort);
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 20;
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

function buildWhere(opts: ArticleListOpts, now: number): { clause: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown): void => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };

  if (opts.includeUnpublished) {
    if (opts.publishState && opts.publishState !== 'all') add('publish_state = ?', opts.publishState);
  } else {
    where.push(`publish_state IN ('published','scheduled')`);
    where.push(`COALESCE(visibility,'public') = 'public'`);
    // A scheduled story becomes public once its publish time arrives.
    where.push(`(publish_state = 'published' OR published_at <= now())`);
  }
  if (opts.category && opts.category !== 'all') add('category = ?', opts.category);
  if (opts.status) add('status = ?', opts.status);
  if (opts.authorId) add('author_id = ?', opts.authorId);
  if (opts.tag) add(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(data->'tags') t WHERE lower(t) = lower(?))`, opts.tag);
  if (opts.featured !== undefined) add('is_featured = ?', opts.featured);
  if (opts.breaking !== undefined) add('is_breaking = ?', opts.breaking);
  if (opts.hasVideo !== undefined) add('has_video = ?', opts.hasVideo);
  if (opts.country && opts.country !== 'all') add('upper(country) = upper(?)', opts.country);
  if (opts.time && opts.time !== 'all') {
    params.push(new Date(now - TIME_WINDOW_MS[opts.time]).toISOString());
    where.push(`published_at >= $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q.trim().toLowerCase()}%`);
    where.push(`(data->>'title' ILIKE $${params.length} OR data->>'titleKiny' ILIKE $${params.length} OR coalesce(data->>'excerpt','') ILIKE $${params.length})`);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function listPg(opts: ArticleListOpts): Promise<{ items: Article[]; total: number }> {
  const limit = Math.min(500, opts.limit ?? 20);
  const offset = opts.offset ?? 0;
  const { clause, params } = buildWhere(opts, Date.now());
  const order =
    opts.sort === 'views'
      ? 'views DESC, published_at DESC'
      : opts.sort === 'oldest'
        ? 'published_at ASC'
        : 'is_breaking DESC, is_pinned DESC, published_at DESC';
  const items = await pgQuery<{ data: Article }>(
    `SELECT data FROM articles ${clause} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const total = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM articles ${clause}`, params);
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

/** Console listing: every row (drafts, archived, unlisted) + filters. */
export async function listArticlesAdminRepo(
  opts: ArticleListOpts = {},
): Promise<{ items: Article[]; total: number }> {
  return listArticlesRepo({ ...opts, includeUnpublished: true });
}

export async function getArticleRepo(id: string): Promise<Article | null> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: Article }>('SELECT data FROM articles WHERE id = $1 OR slug = $1 LIMIT 1', [id]);
      if (r.rows[0]) return r.rows[0].data;
    } catch (err) {
      console.error('[db] articles pg get failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Article[]>(STORE))?.value ?? [];
  return all.find((a) => a.id === id || a.slug === id) ?? null;
}

/** Columns kept in sync with the document, for index-backed listings. */
function columnsFor(a: Article): Record<string, unknown> {
  const state: PublishState = a.publishState ?? 'published';
  return {
    id: a.id,
    category: a.category,
    status: a.status,
    published_at: a.publishedAt,
    fetched_at: a.fetchedAt,
    is_mock: a.isMock,
    slug: a.slug || null,
    language: a.language ?? 'rw',
    country: a.country ?? 'RW',
    district: a.district ?? '',
    author_id: a.authorId ?? null,
    is_featured: Boolean(a.featured),
    is_breaking: Boolean(a.breaking),
    is_pinned: Boolean(a.pinned),
    is_sponsored: Boolean(a.sponsored),
    is_premium: Boolean(a.premium),
    has_video: (a.videos?.length ?? 0) > 0,
    allow_comments: a.allowComments !== false,
    comments_count: a.commentsCount ?? 0,
    views: a.views ?? 0,
    scheduled_at: a.scheduledAt ?? null,
    created_by: a.createdBy ?? null,
    updated_by: a.updatedBy ?? null,
    is_editorial: state !== 'published' || Boolean(a.createdBy) || Boolean(a.slug) || (a.videos?.length ?? 0) > 0,
    publish_state: state,
    visibility: a.visibility ?? 'public',
    data: JSON.stringify(a),
  };
}

const INDEX_COLUMNS = [
  'category', 'status', 'published_at', 'fetched_at', 'is_mock', 'slug', 'language', 'country',
  'district', 'author_id', 'is_featured', 'is_breaking', 'is_pinned', 'is_sponsored', 'is_premium',
  'has_video', 'allow_comments', 'comments_count', 'views', 'scheduled_at', 'created_by', 'updated_by',
  'is_editorial', 'publish_state', 'visibility',
] as const;

/**
 * Upsert many articles. First-seen (created_at) is preserved; the JSONB
 * document plus its indexed mirror columns are replaced wholesale.
 */
export async function upsertArticlesRepo(articles: Article[]): Promise<void> {
  if (articles.length === 0) return;
  if (isPostgresEnabled()) {
    try {
      for (const a of articles) {
        const cols = columnsFor(a);
        const names = ['id', ...INDEX_COLUMNS];
        const values = names.map((n) => cols[n]);
        const placeholders = names.map((_, i) => `$${i + 1}`).join(',');
        const updates = INDEX_COLUMNS.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
        await pgQuery(
          `INSERT INTO articles (${names.join(', ')}, data, created_at)
           VALUES (${placeholders}, $${names.length + 1}, now())
           ON CONFLICT (id) DO UPDATE SET ${updates}, data = EXCLUDED.data, updated_at = now()`,
          [...values, cols.data],
        );
      }
      // Retention cap for feed noise ONLY — anything the newsroom authored,
      // scheduled or enriched with media is never swept away.
      await pgQuery(
        `DELETE FROM articles WHERE is_editorial = FALSE AND id IN (
           SELECT id FROM articles WHERE is_editorial = FALSE ORDER BY published_at DESC OFFSET $1
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
  const keep = all.filter((a) => a.isMock || a.createdBy || a.slug || (a.videos?.length ?? 0) > 0 || a.featured || a.breaking);
  const noise = all.filter((a) => !keep.includes(a)).slice(0, Math.max(0, RETENTION - keep.length));
  await writeStore(STORE, sortJson([...keep, ...noise], 'newest'));
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
             views = views + 1, updated_at = now()
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
        `SELECT author_id, COUNT(*)::text AS count FROM articles WHERE author_id IS NOT NULL GROUP BY 1`,
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

export interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  archived: number;
  breaking: number;
  featured: number;
  withVideo: number;
  withGallery: number;
  totalViews: number;
  byCategory: Array<{ category: string; count: number }>;
}

/** Headline numbers for the dashboard (JSON scan; PG uses the index columns). */
export async function articleStatsRepo(): Promise<ArticleStats> {
  const empty: ArticleStats = {
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    archived: 0,
    breaking: 0,
    featured: 0,
    withVideo: 0,
    withGallery: 0,
    totalViews: 0,
    byCategory: [],
  };
  const compute = (items: Article[]): ArticleStats => {
    const byCat = new Map<string, number>();
    const out: ArticleStats = { ...empty, byCategory: [] };
    for (const a of items) {
      const state = a.publishState ?? 'published';
      out.total++;
      if (state === 'published') out.published++;
      else if (state === 'draft') out.draft++;
      else if (state === 'scheduled') out.scheduled++;
      else if (state === 'archived') out.archived++;
      if (a.breaking) out.breaking++;
      if (a.featured) out.featured++;
      if ((a.videos?.length ?? 0) > 0) out.withVideo++;
      if ((a.gallery?.length ?? 0) > 0) out.withGallery++;
      out.totalViews += a.views ?? 0;
      byCat.set(a.category, (byCat.get(a.category) ?? 0) + 1);
    }
    out.byCategory = [...byCat.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    return out;
  };

  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ data: Article }>('SELECT data FROM articles ORDER BY published_at DESC LIMIT 5000');
      return compute(r.rows.map((x) => x.data));
    } catch (err) {
      console.error('[db] articles pg stats failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return compute((await readStore<Article[]>(STORE))?.value ?? []);
}

/** Toggle a headline flag without rewriting the document (dashboard quick action). */
export async function setArticleFlagsRepo(
  id: string,
  patch: Partial<Pick<Article, 'featured' | 'breaking' | 'pinned' | 'allowComments' | 'publishState' | 'visibility' | 'sponsored' | 'premium'>>,
  actor?: string,
): Promise<Article | null> {
  const current = await getArticleRepo(id);
  if (!current) return null;
  const next: Article = { ...current, ...patch, updatedAt: new Date().toISOString() };
  if (actor) next.updatedBy = actor;
  await upsertArticlesRepo([next]);
  return next;
}

/** Apply the same patch to many stories (bulk publish / feature / delete). */
export async function bulkUpdateArticlesRepo(
  ids: string[],
  patch: Partial<Article>,
): Promise<number> {
  let touched = 0;
  for (const id of ids.slice(0, 100)) {
    const updated = await setArticleFlagsRepo(id, patch as never);
    if (updated) touched++;
  }
  return touched;
}

/** Distinct tags with counts (admin tag manager). */
export async function listTagsRepo(): Promise<Array<{ tag: string; count: number }>> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ tag: string; count: string }>(
        `SELECT lower(trim(t.tag)) AS tag, COUNT(*)::text AS count
         FROM articles a, LATERAL jsonb_array_elements_text(coalesce(a.data->'tags','[]'::jsonb)) AS t(tag)
         WHERE trim(t.tag) <> ''
         GROUP BY 1 ORDER BY 2 DESC LIMIT 300`,
      );
      return r.rows.map((x) => ({ tag: x.tag, count: Number(x.count) }));
    } catch (err) {
      console.error('[db] tags pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const counts = new Map<string, number>();
  for (const a of (await readStore<Article[]>(STORE))?.value ?? []) {
    for (const t of a.tags ?? []) {
      const key = t.trim().toLowerCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 300);
}
