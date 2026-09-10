'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { NewsCategory } from '@/types/news';
import { useNews, useSearch } from '@/hooks/useNews';
import NewsCard from '@/components/news/NewsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { DemoBanner } from '@/components/ui/Badges';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

const CATS: Array<NewsCategory | 'all'> = ['all', 'ubuhinzi', 'politiki', 'ubukungu', 'ikoranabuhanga', 'ubuzima', 'imikino', 'amahanga'];

function Listing() {
  const { s, locale } = useLocale();
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const category = (params.get('category') ?? 'all') as NewsCategory | 'all';

  const news = useNews(q ? undefined : category);
  const search = useSearch(q);

  const loading = q ? search.loading : news.loading;
  const error = q ? search.error : news.error;
  const retry = q ? search.retry : news.retry;
  const dataMode = q ? search.dataMode : news.dataMode;
  const articles = q ? search.hits.map((h) => h.article) : news.full;

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-white text-xl font-bold mb-4">
        {q ? `${locale === 'rw' ? s.search.label.rw : s.search.label.en}: “${q}”` : locale === 'rw' ? s.nav.news.rw : s.nav.news.en}
      </h1>

      <div className="mb-4 max-w-xl">
        <SearchBar initial={q} />
      </div>

      {!q && (
        <nav aria-label={locale === 'rw' ? 'Ibyiciro' : 'Categories'} className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10">
          {CATS.map((c) => {
            const active = category === c;
            return (
              <Link
                key={c}
                href={c === 'all' ? '/amakuru' : `/amakuru?category=${c}`}
                aria-current={active ? 'page' : undefined}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  active ? 'bg-[#00c853] text-black border-[#00c853]' : 'bg-transparent text-white/60 border-white/15 hover:border-white/30 hover:text-white'
                }`}
              >
                {locale === 'rw' ? s.categories[c].rw : s.categories[c].en}
              </Link>
            );
          })}
        </nav>
      )}

      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : articles.length === 0 ? (
        <EmptyState message={q ? (locale === 'rw' ? s.search.noResults.rw : s.search.noResults.en) : undefined} />
      ) : (
        <div>
          <DemoBanner mode={dataMode} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {articles.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto px-4 py-6"><LoadingSkeleton lines={4} /></main>}>
      <Listing />
    </Suspense>
  );
}
