'use client';

import { useState } from 'react';
import type { ForecastHorizon } from '@/types/forecasting';
import { useForecasts } from '@/hooks/useForecasts';
import { ForecastCard } from '@/components/forecasts/ForecastCard';
import { TrackRecord } from '@/components/forecasts/TrackRecord';
import { DemoBanner } from '@/components/ui/Badges';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

const HORIZONS: ForecastHorizon[] = ['7d', '14d', '30d'];

export default function ForecastsPage() {
  const { t, s, locale } = useLocale();
  const [horizon, setHorizon] = useState<ForecastHorizon>('14d');
  const { forecasts, trackRecord, modelVersion, loading, error, retry, dataMode } = useForecasts({ horizon });

  const pending = forecasts.filter((f) => f.evaluation === 'pending');
  const decided = forecasts.filter((f) => f.evaluation !== 'pending');

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-white text-xl font-bold mb-1">
        {t(s.forecasts.title)}
      </h1>
      <p className="text-white/50 text-sm mb-1">
        {locale === 'rw'
          ? 'Ihanura ni amahirwe, si ukuri. Buri ihanura ryerekana ibimenyetso, ibyizerwa, n’ibyaryoshya.'
          : 'Forecasts are probabilities, not facts. Each shows evidence, assumptions and invalidators.'}
      </p>
      <p className="text-white/35 text-xs mb-5">
        {t(s.forecasts.model)}: {modelVersion || '…'}
        {' · '}
        {locale === 'rw' ? 'Ubuhinzi gusa — nta hanura rya politiki' : 'Agriculture only — no political forecasts'}
      </p>

      <DemoBanner mode={dataMode} />

      <div role="tablist" aria-label={locale === 'rw' ? 'Igihe cy’ihanura' : 'Horizon'} className="flex gap-2 mb-5">
        {HORIZONS.map((h) => (
          <button
            key={h}
            role="tab"
            aria-selected={horizon === h}
            onClick={() => setHorizon(h)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              horizon === h ? 'bg-[#00c853] text-black border-[#00c853]' : 'text-white/60 border-white/15 hover:border-white/30 hover:text-white'
            }`}
          >
            {h === '7d' ? (locale === 'rw' ? 'Iminsi 7' : '7 days') : h === '14d' ? (locale === 'rw' ? 'Iminsi 14' : '14 days') : (locale === 'rw' ? 'Iminsi 30' : '30 days')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : forecasts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="fc-pending">
            <h2 id="fc-pending" className="text-white text-[15px] font-bold mb-3">
              {t(s.forecasts.pending)} ({pending.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {pending.map((f) => <ForecastCard key={f.id} forecast={f} />)}
            </div>
          </section>

          {trackRecord && <TrackRecord record={trackRecord} />}

          {decided.length > 0 && (
            <section aria-labelledby="fc-decided">
              <h2 id="fc-decided" className="text-white text-[15px] font-bold mb-3">
                {t(s.forecasts.evaluated)} ({decided.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {decided.slice(0, 6).map((f) => <ForecastCard key={f.id} forecast={f} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
