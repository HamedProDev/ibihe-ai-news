'use client';

import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarket';
import { MarketTrendCard } from '@/components/markets/MarketCards';
import { MarketFilters, type FilterValue } from '@/components/markets/MarketFilters';
import { ObservationTable } from '@/components/markets/ObservationTable';
import { DemoBanner } from '@/components/ui/Badges';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { COMMODITIES } from '@/lib/market/commodities';
import type { CommodityId } from '@/types/market';
import { useLocale } from '@/components/i18n/LanguageProvider';

export default function MarketsPage() {
  const { t, s, locale } = useLocale();
  const [filters, setFilters] = useState<FilterValue>({ commodity: '', district: '', market: '', windowDays: 30 });
  const { observations, trends, districts, markets, loading, error, retry, dataMode } = useMarketData({
    commodity: filters.commodity && filters.commodity in COMMODITIES ? (filters.commodity as CommodityId) : undefined,
    district: filters.district || undefined,
    market: filters.market || undefined,
    windowDays: filters.windowDays,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-white text-xl font-bold mb-1">
        {t(s.markets.title)}
      </h1>
      <p className="text-white/50 text-sm mb-5">
        {locale === 'rw'
          ? 'Ibiciro by’ibiribwa ku masoko — hamwe n’ingero y’aho, RWF/kg, n’igihe byafatiwe.'
          : 'Food prices across markets — with original units, RWF/kg, and observed times.'}
      </p>

      <MarketFilters value={filters} districts={districts} markets={markets} onChange={setFilters} />

      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : trends.length === 0 && observations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <DemoBanner mode={dataMode} />
          {trends.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {trends.map((t) => (
                <MarketTrendCard key={`${t.commodity}-${t.market ?? ''}-${t.district ?? ''}`} trend={t} />
              ))}
            </div>
          )}
          {observations.length > 0 && (
            <section aria-labelledby="obs-h">
              <h2 id="obs-h" className="text-white text-[15px] font-bold mb-3">
                {t(s.markets.observations)} ({observations.length})
              </h2>
              <ObservationTable observations={observations.slice(0, 60)} />
            </section>
          )}
        </div>
      )}
    </main>
  );
}
