'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Article } from '@/types';
import NewsCard from '@/components/news/NewsCard';
import { FilterBar, DEFAULT_FILTERS, type NewsFilters } from './FilterBar';
import { EmptyState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

function readArticles(json: unknown): Article[] {
  if (!json || typeof json !== 'object') return [];
  const o = json as Record<string, unknown>;
  const data = o.data as Record<string, unknown> | undefined;
  const list = data?.articles ?? o.articles;
  return Array.isArray(list) ? (list as Article[]) : [];
}

function readHits(json: unknown): Article[] {
  if (!json || typeof json !== 'object') return [];
  const data = (json as Record<string, unknown>).data as Record<string, unknown> | undefined;
  const hits = data?.hits;
  if (!Array.isArray(hits)) return [];
  return hits
    .map((h) => (h as { article?: Article }).article)
    .filter((a): a is Article => Boolean(a && typeof a === 'object' && 'id' in a));
}

export function NewsExplorer({
  initial,
  initialFilters,
  query,
  showFilters = true,
  limit = 12,
}: {
  initial: Article[];
  initialFilters?: Partial<NewsFilters>;
  query?: string;
  showFilters?: boolean;
  limit?: number;
}) {
  const { t, s } = useLocale();
  const [filters, setFilters] = useState<NewsFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [articles, setArticles] = useState<Article[]>(initial);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (f: NewsFilters) => {
    setLoading(true);
    try {
      if (query) {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        setArticles(readHits(await res.json()));
      } else {
        const p = new URLSearchParams({
          category: f.category,
          time: f.time,
          country: f.country,
          limit: String(limit),
        });
        const res = await fetch(`/api/news?${p.toString()}`);
        setArticles(readArticles(await res.json()));
      }
    } catch {
      /* keep previous list */
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

  // Refetch when filters change (skip the first render — SSR already did it).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void load(filters);
  }, [filters, load]);

  return (
    <div>
      {showFilters && !query && (
        <div className="mb-5">
          <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />
        </div>
      )}
      {loading ? (
        <LoadingSkeleton lines={6} label={t(s.states.loading)} />
      ) : articles.length === 0 ? (
        <EmptyState message={query ? t(s.search.noResults) : t(s.states.empty)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
