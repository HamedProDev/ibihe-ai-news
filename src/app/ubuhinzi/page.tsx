'use client';

import Link from 'next/link';
import { Sprout, LineChart, CloudSun, Telescope } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import { useMarketData } from '@/hooks/useMarket';
import { useForecasts } from '@/hooks/useForecasts';
import NewsCard from '@/components/news/NewsCard';
import { MarketTrendCard } from '@/components/markets/MarketCards';
import { ForecastCard } from '@/components/forecasts/ForecastCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { DemoBanner } from '@/components/ui/Badges';
import { COMMODITY_IDS, COMMODITIES } from '@/lib/market/commodities';
import { useLocale } from '@/components/i18n/LanguageProvider';

export default function AgriculturePage() {
  const { s, locale } = useLocale();
  const news = useNews('ubuhinzi');
  const market = useMarketData({ windowDays: 30 });
  const fc = useForecasts({ horizon: '14d' });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="flex items-center gap-2 text-white text-xl font-bold mb-1">
        <Sprout size={20} className="text-[#00c853]" aria-hidden="true" />
        {locale === 'rw' ? s.nav.agriculture.rw : s.nav.agriculture.en}
      </h1>
      <p className="text-white/50 text-sm mb-6">
        {locale === 'rw'
          ? 'Amakuru y’ubuhinzi, ibiciro by’isoko, ikirere n’ihanura — byose hamwe.'
          : 'Farming news, market prices, weather and forecasts — together.'}
      </p>

      {/* Commodity quick links */}
      <nav aria-label={locale === 'rw' ? 'Ibicuruzwa' : 'Commodities'} className="flex gap-2 flex-wrap mb-8">
        {COMMODITY_IDS.map((id) => (
          <Link
            key={id}
            href={`/isoko/${id}`}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/75 hover:border-[#00c853]/50 hover:text-white transition-all"
          >
            {locale === 'rw' ? COMMODITIES[id]?.nameKiny : COMMODITIES[id]?.nameEn}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="agri-news" className="mb-8">
        <div id="agri-news">
          <SectionHeader title={locale === 'rw' ? s.nav.news.rw : s.nav.news.en} href="/amakuru?category=ubuhinzi" />
        </div>
        {news.loading ? <LoadingSkeleton lines={2} /> : news.error ? <ErrorState error={news.error} onRetry={news.retry} /> : news.full.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {news.full.slice(0, 3).map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="agri-market" className="mb-8">
        <div id="agri-market">
          <SectionHeader
            title={locale === 'rw' ? s.home.marketSnapshot.rw : s.home.marketSnapshot.en}
            href="/isoko"
            icon={<LineChart size={15} className="text-[#00c853]" aria-hidden="true" />}
          />
        </div>
        {market.loading ? <LoadingSkeleton lines={2} /> : market.error ? <ErrorState error={market.error} onRetry={market.retry} /> : market.trends.length === 0 ? <EmptyState /> : (
          <div>
            <DemoBanner mode={market.dataMode} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {market.trends.slice(0, 3).map((t) => <MarketTrendCard key={t.commodity} trend={t} />)}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="agri-fc">
        <div id="agri-fc">
          <SectionHeader
            title={locale === 'rw' ? s.home.forecasts.rw : s.home.forecasts.en}
            href="/ibimenyetso"
            icon={<Telescope size={15} className="text-cyan-300" aria-hidden="true" />}
          />
        </div>
        {fc.loading ? <LoadingSkeleton lines={2} /> : fc.error ? <ErrorState error={fc.error} onRetry={fc.retry} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fc.forecasts.filter((f) => f.evaluation === 'pending').slice(0, 2).map((f) => <ForecastCard key={f.id} forecast={f} />)}
          </div>
        )}
        <Link href="/ikirere" className="mt-4 inline-flex items-center gap-2 text-[#00c853] text-sm font-medium hover:underline">
          <CloudSun size={15} aria-hidden="true" />
          {locale === 'rw' ? s.home.weatherAgri.rw : s.home.weatherAgri.en} →
        </Link>
      </section>
    </main>
  );
}
