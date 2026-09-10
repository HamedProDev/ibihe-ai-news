'use client';

import Link from 'next/link';
import { Flame, LineChart, CloudSun, Telescope, Newspaper } from 'lucide-react';
import { useNews, useBriefing } from '@/hooks/useNews';
import { useMarketData } from '@/hooks/useMarket';
import { useForecasts } from '@/hooks/useForecasts';
import { useWeather } from '@/hooks/useWeather';
import NewsCard from '@/components/news/NewsCard';
import { BriefingCard } from '@/components/news/BriefingCard';
import { MarketTrendCard } from '@/components/markets/MarketCards';
import { ForecastCard } from '@/components/forecasts/ForecastCard';
import { AskIbihe } from '@/components/ai/AskIbihe';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DemoBanner } from '@/components/ui/Badges';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

const QUICK_CATS = ['ubuhinzi', 'ubukungu', 'ikoranabuhanga', 'ubuzima', 'politiki', 'amahanga'] as const;

function QuickCategories() {
  const { s, locale } = useLocale();
  return (
    <nav aria-label={locale === 'rw' ? 'Ibyiciro' : 'Categories'} className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10">
      {QUICK_CATS.map((c) => (
        <Link
          key={c}
          href={`/amakuru?category=${c}`}
          className="px-4 py-1.5 rounded-full text-sm font-medium border bg-transparent text-white/60 border-white/15 hover:border-white/30 hover:text-white transition-all"
        >
          {locale === 'rw' ? s.categories[c].rw : s.categories[c].en}
        </Link>
      ))}
    </nav>
  );
}

function LeadSection() {
  const { s, locale } = useLocale();
  const { full, loading, error, retry, dataMode } = useNews();
  const hero = full[0];
  const essentials = full.slice(1, 5);

  if (loading) return <LoadingSkeleton lines={3} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!hero) return <EmptyState />;

  return (
    <div>
      <DemoBanner mode={dataMode} />
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} className="text-[#00c853]" aria-hidden="true" />
        <span className="text-white/60 text-xs font-medium uppercase tracking-widest">
          {locale === 'rw' ? s.home.leadStory.rw : s.home.leadStory.en}
        </span>
      </div>
      <NewsCard article={hero} variant="hero" />

      {essentials.length > 0 && (
        <div className="mt-6">
          <SectionHeader
            title={locale === 'rw' ? s.home.todayEssentials.rw : s.home.todayEssentials.en}
            href="/amakuru"
            icon={<Newspaper size={15} className="text-[#00c853]" aria-hidden="true" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {essentials.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketSection() {
  const { s, locale } = useLocale();
  const { trends, loading, error, retry, dataMode } = useMarketData({ windowDays: 30 });
  return (
    <section aria-labelledby="home-markets" className="mt-8">
      <div id="home-markets">
        <SectionHeader
          title={locale === 'rw' ? s.home.marketSnapshot.rw : s.home.marketSnapshot.en}
          href="/isoko"
          icon={<LineChart size={15} className="text-[#00c853]" aria-hidden="true" />}
        />
      </div>
      {loading ? (
        <LoadingSkeleton lines={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : trends.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <DemoBanner mode={dataMode} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {trends.slice(0, 3).map((t) => (
              <MarketTrendCard key={t.commodity} trend={t} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ForecastSection() {
  const { s, locale } = useLocale();
  const { forecasts, loading, error, retry } = useForecasts({ horizon: '14d' });
  const items = forecasts.filter((f) => f.evaluation === 'pending').slice(0, 2);
  return (
    <section aria-labelledby="home-fc" className="mt-8">
      <div id="home-fc">
        <SectionHeader
          title={locale === 'rw' ? s.home.forecasts.rw : s.home.forecasts.en}
          href="/ibimenyetso"
          icon={<Telescope size={15} className="text-cyan-300" aria-hidden="true" />}
        />
      </div>
      {loading ? (
        <LoadingSkeleton lines={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((f) => (
            <ForecastCard key={f.id} forecast={f} />
          ))}
        </div>
      )}
    </section>
  );
}

function Sidebar() {
  const { s, locale } = useLocale();
  const { briefing, loading: bLoading, error: bError, retry: bRetry } = useBriefing();
  const { weather, advisory, loading: wLoading } = useWeather('Gasabo');

  return (
    <aside className="space-y-5">
      {bLoading ? (
        <LoadingSkeleton lines={1} />
      ) : bError ? (
        <ErrorState error={bError} onRetry={bRetry} />
      ) : briefing ? (
        <BriefingCard briefing={briefing} />
      ) : null}

      <section aria-labelledby="home-wx" className="bg-[#0a0e1a] border border-blue-500/20 rounded-2xl p-4">
        <h2 id="home-wx" className="flex items-center gap-2 text-white text-sm font-semibold mb-2">
          <CloudSun size={15} className="text-blue-300" aria-hidden="true" />
          {locale === 'rw' ? s.home.weatherAgri.rw : s.home.weatherAgri.en}
        </h2>
        {wLoading ? (
          <div className="h-16 bg-white/5 rounded-lg animate-pulse" aria-hidden="true" />
        ) : weather && weather.available ? (
          <Link href="/ikirere?district=Gasabo" className="block group">
            <p className="text-white/80 text-sm leading-relaxed group-hover:text-white">
              {advisory
                ? locale === 'rw' ? advisory.rainfallOutlookKiny : advisory.rainfallOutlookEn
                : `${weather.district}: ${Math.round(weather.observation?.tempC ?? 0)}°`}
            </p>
            <p className="text-[#00c853] text-[13px] font-medium mt-1.5 group-hover:underline">
              {locale === 'rw' ? 'Reba inama z’ubuhinzi' : 'See farming advice'} →
            </p>
          </Link>
        ) : (
          <p className="text-white/45 text-[13px]">{locale === 'rw' ? s.data.unavailable.rw : s.data.unavailable.en}</p>
        )}
      </section>

      <AskIbihe compact />
    </aside>
  );
}

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <QuickCategories />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8">
        <div className="min-w-0">
          <LeadSection />
          <MarketSection />
          <ForecastSection />
        </div>
        <Sidebar />
      </div>
    </main>
  );
}
