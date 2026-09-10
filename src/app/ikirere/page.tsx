'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeather } from '@/hooks/useWeather';
import { AgroWeather } from '@/components/weather/AgroWeather';
import { ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { RWANDA_DISTRICTS } from '@/lib/geo/rwanda';
import { useLocale } from '@/components/i18n/LanguageProvider';

function WeatherInner() {
  const { s, locale } = useLocale();
  const params = useSearchParams();
  const initial = params.get('district') ?? 'Gasabo';
  const [district, setDistrict] = useState(initial);
  const { weather, advisory, loading, error, retry } = useWeather(district);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-white text-xl font-bold mb-1">
        {locale === 'rw' ? s.weather.title.rw : s.weather.title.en}
      </h1>
      <p className="text-white/50 text-sm mb-5">
        {locale === 'rw'
          ? 'Iteganyagihe rihuza n’ubuhinzi: imvura → ingaruka ku bihingwa → inama → kutamenya.'
          : 'Weather connected to farming: rainfall → crop impact → advice → uncertainty.'}
      </p>

      <label className="flex flex-col gap-1.5 mb-5 max-w-xs">
        <span className="text-xs text-white/45">{locale === 'rw' ? s.markets.district.rw : s.markets.district.en}</span>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c853]/60"
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
    <Suspense fallback={<main className="max-w-4xl mx-auto px-4 py-6"><LoadingSkeleton lines={3} /></main>}>
      <WeatherInner />
    </Suspense>
  );
}
