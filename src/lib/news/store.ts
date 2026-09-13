/**
 * Article serving layer (server-only).
 *
 * Read path: stored ingested articles (fresh) → stale cache → demo seeds.
 * The response ALWAYS declares its dataMode so the UI can label demo
 * content honestly. Refresh is best-effort and never blocks reads for long.
 * Storage backend: Postgres when DATABASE_URL is set, else JSON file store.
 */
import type { DataMode } from '../../types/provenance';
import type { Article, NewsCategory, StoryCluster } from '../../types/news';
import { isPubliclyListed, listArticlesRepo, getArticleRepo } from '../db/repos/articles.ts';
import { canonicalCategory, CATEGORY_SLUGS } from './category-registry.ts';
import { clusterArticles, relatedArticles } from './cluster.ts';
import { DEMO_ARTICLES } from './demo-seeds.ts';
import { readIngestMeta, runIngestion, type IngestMeta } from './ingest.ts';

export const CACHE_FRESH_MS = 30 * 60 * 1000;

export type TimeFilter = '24h' | '7d' | '30d' | 'all';

export interface ArticleQuery {
  category?: NewsCategory | 'all';
  limit?: number;
  offset?: number;
  /** Only articles published within the window. */
  time?: TimeFilter;
  /** ISO country code (e.g. 'RW'); 'all' disables. */
  country?: string;
  /** 'newest' (default) or 'views' for trending. */
  sort?: 'newest' | 'views' | 'oldest';
  /** Editorial flags (homepage hero, breaking rail, video hub). */
  featured?: boolean;
  breaking?: boolean;
  hasVideo?: boolean;
  /** Single tag (lowercase, no '#'). */
  tag?: string;
  status?: string;
  authorId?: string;
  /** Title/excerpt substring search (light; /api/search is the indexer). */
  q?: string;
}

const TIME_WINDOW_MS: Record<Exclude<TimeFilter, 'all'>, number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

export interface ArticleListResult {
  articles: Article[];
  clusters: StoryCluster[];
  total: number;
  dataMode: DataMode;
  fetchedAt: string;
  ingestMeta: IngestMeta | null;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function metaAgeMs(meta: IngestMeta | null): number {
  if (!meta?.lastRunAt) return Number.POSITIVE_INFINITY;
  return Date.now() - new Date(meta.lastRunAt).getTime();
}

export async function listArticles(query: ArticleQuery = {}): Promise<ArticleListResult> {
  const fetchedAt = new Date().toISOString();
  let meta = await readIngestMeta();
  let age = metaAgeMs(meta);

  // Refresh when stale; wait only briefly, then serve whatever we have.
  if (age > CACHE_FRESH_MS) {
    const refreshed = await withTimeout(runIngestion(), 9000);
    if (refreshed) {
      meta = await readIngestMeta();
      age = metaAgeMs(meta);
    }
  }

  const { category = 'all', limit = 20, offset = 0 } = query;
  // Retention is capped at 500 rows, so one read serves listing + clustering.
  const stored = (await listArticlesRepo({ limit: 500 })).items;

  let articles = stored;
  // Legacy feed slugs (ubuhinzi, ibidukikije, imvurugano…) land on their
  // Rwanda-first successors so old rows render + filter correctly even
  // before migration 005 runs against them.
  articles = articles.map((a) =>
    (a.category as string) && !(CATEGORY_SLUGS as string[]).includes(a.category)
      ? { ...a, category: canonicalCategory(a.category) }
      : a,
  );
  let dataMode: DataMode = 'live';
  if (articles.length === 0) {
    articles = DEMO_ARTICLES;
    dataMode = 'demo';
  } else if (age > CACHE_FRESH_MS) {
    dataMode = 'mixed'; // live articles, possibly stale
  }

  const { time = 'all', country = 'all', sort = 'newest' } = query;
  // Drafts, archived and unlisted stories never appear publicly; scheduled
  // ones appear as soon as their publish time arrives.
  const now = Date.now();
  articles = articles.filter((a) => (articles === DEMO_ARTICLES ? true : isPubliclyListed(a, now)));

  let filtered = category === 'all' ? articles : articles.filter((a) => a.category === category);
  if (query.featured !== undefined) filtered = filtered.filter((a) => Boolean(a.featured) === query.featured);
  if (query.breaking !== undefined) filtered = filtered.filter((a) => Boolean(a.breaking) === query.breaking);
  if (query.hasVideo !== undefined) {
    filtered = filtered.filter((a) => ((a.videos?.length ?? 0) > 0) === query.hasVideo);
  }
  if (query.tag) filtered = filtered.filter((a) => (a.tags ?? []).includes(query.tag!));
  if (query.status) filtered = filtered.filter((a) => a.status === query.status);
  if (query.authorId) filtered = filtered.filter((a) => a.authorId === query.authorId);
  if (query.q) {
    const needle = query.q.toLowerCase();
    filtered = filtered.filter((a) => `${a.title} ${a.titleKiny} ${a.excerpt}`.toLowerCase().includes(needle));
  }
  if (time !== 'all') {
    const cutoff = Date.now() - TIME_WINDOW_MS[time];
    filtered = filtered.filter((a) => {
      const t = new Date(a.publishedAt || a.fetchedAt).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });
  }
  if (country !== 'all') {
    const want = country.toUpperCase();
    filtered = filtered.filter((a) => (a.country ?? 'RW').toUpperCase() === want);
  }
  if (sort === 'views') {
    filtered = [...filtered].sort(
      (a, b) => (b.views ?? 0) - (a.views ?? 0) || +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
  } else if (sort === 'oldest') {
    filtered = [...filtered].sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
  } else {
    // Breaking + pinned stories lead the newest-first feed.
    filtered = [...filtered].sort(
      (a, b) => Number(Boolean(b.breaking)) - Number(Boolean(a.breaking)) || +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
  }
  const clusters = clusterArticles(articles);
  const withCluster = filtered.map((a) => {
    const c = clusters.find((cl) => cl.articleIds.includes(a.id));
    return c ? { ...a, clusterId: c.id } : a;
  });

  return {
    articles: withCluster.slice(offset, offset + limit),
    clusters,
    total: filtered.length,
    dataMode,
    fetchedAt,
    ingestMeta: meta,
  };
}

export async function getArticle(id: string): Promise<{
  article: Article | null;
  related: Article[];
  cluster: StoryCluster | null;
  dataMode: DataMode;
}> {
  // Try direct lookup first (fast on Postgres); fall back to full listing
  // (covers demo seeds when no live rows exist yet).
  const direct = await getArticleRepo(id).catch(() => null);
  const { articles, clusters, dataMode } = await listArticles({ limit: 500 });
  // Demo seeds stay readable even once live rows exist, so a shared dev
  // database never turns the documented sample stories into 404s.
  const seed = DEMO_ARTICLES.find((a) => a.id === id) ?? null;
  const found = direct ?? articles.find((a) => a.id === id) ?? seed;
  const article = found && !(CATEGORY_SLUGS as string[]).includes(found.category)
    ? { ...found, category: canonicalCategory(found.category) }
    : found;
  if (!article) return { article: null, related: [], cluster: null, dataMode };
  const cluster = clusters.find((c) => c.articleIds.includes(id)) ?? null;
  const related = relatedArticles(article, articles, 4);
  return { article, related, cluster, dataMode };
}

/** All articles (for search/ask) without pagination. */
export async function allArticles(): Promise<{ articles: Article[]; dataMode: DataMode }> {
  const r = await listArticles({ limit: 500 });
  return { articles: r.articles, dataMode: r.dataMode };
}

export { readIngestMeta };
export type { IngestMeta };
