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
import { listArticlesRepo, getArticleRepo } from '../db/repos/articles.ts';
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
  sort?: 'newest' | 'views';
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
  let dataMode: DataMode = 'live';
  if (articles.length === 0) {
    articles = DEMO_ARTICLES;
    dataMode = 'demo';
  } else if (age > CACHE_FRESH_MS) {
    dataMode = 'mixed'; // live articles, possibly stale
  }

  const { time = 'all', country = 'all', sort = 'newest' } = query;
  let filtered = category === 'all' ? articles : articles.filter((a) => a.category === category);
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
  const article = direct ?? articles.find((a) => a.id === id) ?? null;
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
