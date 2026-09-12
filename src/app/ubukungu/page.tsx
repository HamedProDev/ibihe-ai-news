'use client';

import { Landmark } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import { useMarketData } from '@/hooks/useMarket';
import NewsCard from '@/components/news/NewsCard';
import { MarketTrendCard } from '@/components/markets/MarketCards';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

export default function EconomyPage() {
  const { t, s, locale } = useLocale();
  const news = useNews('ubukungu');
  const market = useMarketData({ windowDays: 30 });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="flex items-center gap-2 text-white text-xl font-bold mb-1">
        <Landmark size={20} className="text-amber-300" aria-hidden="true" />
        {t(s.nav.economy)}
      </h1>
      <p className="text-white/50 text-sm mb-6">
        {locale === 'rw'
          ? 'Amakuru y’ubukungu n’isoko — ushingiye ku bimenyetso, atari impuha.'
          : 'Economy and market news — grounded in evidence, not rumors.'}
      </p>

      <section aria-labelledby="econ-news" className="mb-8">
        <div id="econ-news">
          <SectionHeader title={t(s.nav.news)} href="/amakuru?category=ubukungu" />
        </div>
        {news.loading ? <LoadingSkeleton lines={2} /> : news.error ? <ErrorState error={news.error} onRetry={news.retry} /> : news.full.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {news.full.slice(0, 6).map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="econ-mkt">
        <div id="econ-mkt">
          <SectionHeader title={t(s.home.marketSnapshot)} href="/isoko" />
        </div>
        {market.loading ? <LoadingSkeleton lines={2} /> : market.error ? <ErrorState error={market.error} onRetry={market.retry} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {market.trends.slice(0, 3).map((t) => <MarketTrendCard key={t.commodity} trend={t} />)}
          </div>
        )}
      </section>
    </main>
  );
}
