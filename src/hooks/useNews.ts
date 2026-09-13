'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Article, NewsArticle, Prediction, StoryCluster, WhyItMatters } from '@/types';
import { toLegacyArticle } from '@/types';
import type { IngestMeta } from '@/lib/news/ingest';
import type { DailyBriefing } from '@/lib/news/briefing';
import type { SearchHit } from '@/lib/news/search';

interface NewsData {
  articles: Article[];
  clusters: StoryCluster[];
  total: number;
  ingestMeta: IngestMeta | null;
}

/**
 * News hook. Returns new Article objects plus legacy-adapted `legacy`
 * items for components still being migrated. Backwards compatible with the
 * previous { articles, loading } shape (articles are now legacy-shaped).
 */
export function useNews(category?: string) {
  const path = useMemo(
    () => (category && category !== 'all' ? `/api/news?category=${encodeURIComponent(category)}` : '/api/news'),
    [category],
  );
  const { data, loading, error, dataMode, retry } = useApi<NewsData>(path, [path]);
  const articles: NewsArticle[] = useMemo(() => (data?.articles ?? []).map(toLegacyArticle), [data]);
  return {
    articles,
    full: data?.articles ?? [],
    clusters: data?.clusters ?? [],
    total: data?.total ?? 0,
    ingestMeta: data?.ingestMeta ?? null,
    loading,
    error,
    dataMode,
    retry,
  };
}

interface ArticleData {
  article: Article;
  related: Article[];
  cluster: StoryCluster | null;
  whyItMatters: WhyItMatters[];
}

export function useArticle(id: string | null) {
  const path = id ? `/api/articles/${encodeURIComponent(id)}` : null;
  const { data, loading, error, dataMode, retry } = useApi<ArticleData>(path, [path]);
  return {
    article: data?.article ?? null,
    related: data?.related ?? [],
    cluster: data?.cluster ?? null,
    whyItMatters: data?.whyItMatters ?? [],
    loading,
    error,
    dataMode,
    retry,
  };
}

interface SearchData {
  query: string;
  hits: SearchHit[];
  total: number;
}

export function useSearch(query: string) {
  const q = query.trim();
  const path = q.length >= 2 ? `/api/search?q=${encodeURIComponent(q)}` : null;
  const { data, loading, error, dataMode, retry } = useApi<SearchData>(path, [path]);
  return { hits: data?.hits ?? [], total: data?.total ?? 0, loading, error, dataMode, retry };
}

export function useBriefing() {
  const { data, loading, error, dataMode, retry } = useApi<DailyBriefing>('/api/briefing');
  return { briefing: data, loading, error, dataMode, retry };
}

/** @deprecated Use useForecasts instead. */
export function usePredictions(category?: string) {
  const path = useMemo(
    () => (category && category !== 'all' ? `/api/predictions?category=${encodeURIComponent(category)}` : '/api/predictions'),
    [category],
  );
  const { data, loading, error, retry } = useApi<{ predictions: Prediction[] }>(path, [path]);
  return { predictions: data?.predictions ?? [], loading, error, retry };
}
