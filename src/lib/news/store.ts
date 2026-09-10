/**
 * Article serving layer (server-only).
 *
 * Read path: stored ingested articles (fresh) → stale cache → demo seeds.
 * The response ALWAYS declares its dataMode so the UI can label demo
 * content honestly. Refresh is best-effort and never blocks reads for long.
 */
import type { DataMode } from '../../types/provenance';
import type { Article, NewsCategory, StoryCluster } from '../../types/news';
import { readStore, storeAgeMs } from '../db/json-store.ts';
import { clusterArticles, relatedArticles } from './cluster.ts';
import { DEMO_ARTICLES } from './demo-seeds.ts';
import { ARTICLES_STORE, INGEST_META_STORE, readIngestMeta, runIngestion, type IngestMeta } from './ingest.ts';

export const CACHE_FRESH_MS = 30 * 60 * 1000;

export interface ArticleQuery {
  category?: NewsCategory | 'all';
  limit?: number;
  offset?: number;
}

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

export async function listArticles(query: ArticleQuery = {}): Promise<ArticleListResult> {
  const fetchedAt = new Date().toISOString();
  const envelope = await readStore<Article[]>(ARTICLES_STORE);
  const age = storeAgeMs(envelope);
  let stored = envelope?.value ?? [];

  // Refresh in the background when stale; wait only briefly.
  if (age > CACHE_FRESH_MS) {
    const refreshed = await withTimeout(runIngestion(), 9000);
    if (refreshed && refreshed.total > 0) {
      stored = (await readStore<Article[]>(ARTICLES_STORE))?.value ?? stored;
    }
  }

  const ingestMeta = await readIngestMeta();
  let articles = stored;
  let dataMode: DataMode = 'live';
  if (articles.length === 0) {
    articles = DEMO_ARTICLES;
    dataMode = 'demo';
  } else if (age > CACHE_FRESH_MS) {
    dataMode = 'mixed'; // live articles, possibly stale
  }

  const { category = 'all', limit = 20, offset = 0 } = query;
  const filtered = category === 'all' ? articles : articles.filter((a) => a.category === category);
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
    ingestMeta,
  };
}

export async function getArticle(id: string): Promise<{
  article: Article | null;
  related: Article[];
  cluster: StoryCluster | null;
  dataMode: DataMode;
}> {
  const { articles, clusters, dataMode } = await listArticles({ limit: 500 });
  const article = articles.find((a) => a.id === id) ?? null;
  if (!article) return { article: null, related: [], cluster: null, dataMode };
  const cluster = clusters.find((c) => c.articleIds.includes(id)) ?? null;
  const pool = articles;
  const related = relatedArticles(article, pool, 4);
  return { article, related, cluster, dataMode };
}

/** All articles (for search/ask) without pagination. */
export async function allArticles(): Promise<{ articles: Article[]; dataMode: DataMode }> {
  const r = await listArticles({ limit: 500 });
  return { articles: r.articles, dataMode: r.dataMode };
}

export { INGEST_META_STORE, readIngestMeta };
export type { IngestMeta };
