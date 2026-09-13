'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeather } from '@/hooks/useWeather';
import { AgroWeather } from '@/components/weather/AgroWeather';
import { ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { RWANDA_DISTRICTS } from '@/lib/geo/rwanda';
import { useLocale } from '@/components/i18n/LanguageProvider';

function WeatherInner() {
  const { t, s, locale } = useLocale();
  const params = useSearchParams();
  const initial = params.get('district') ?? 'Gasabo';
  const [district, setDistrict] = useState(initial);
  const { weather, advisory, loading, error, retry } = useWeather(district);

  return (
    <main className="x-container py-6 sm:py-8">
      <h1 className="text-ink text-xl font-bold mb-1">
        {t(s.weather.title)}
      </h1>
      <p className="text-ink/50 text-sm mb-5">
        {locale === 'rw'
          ? 'Iteganyagihe rihuza n’ubuhinzi: imvura → ingaruka ku bihingwa → inama → kutamenya.'
          : 'Weather connected to farming: rainfall → crop impact → advice → uncertainty.'}
      </p>

      <label className="flex flex-col gap-1.5 mb-5 max-w-xs">
        <span className="text-xs text-ink/45">{t(s.markets.district)}</span>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="bg-ink/5 border border-ink/15 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/60"
        >
          {RWANDA_DISTRICTS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name} — {locale === 'rw' ? d.province : d.provinceEn}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <LoadingSkeleton lines={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : weather ? (
        <AgroWeather weather={weather} advisory={advisory} />
      ) : null}
    </main>
  );
}

export default function WeatherPage() {
  return (
    <Suspense fallback={<main className="x-container py-6 sm:py-8"><LoadingSkeleton lines={3} /></main>}>
      <WeatherInner />
    </Suspense>
  );
}
