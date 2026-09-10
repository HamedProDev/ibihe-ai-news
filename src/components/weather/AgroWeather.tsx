'use client';

import { CloudRain, Droplets, Eye, Sparkles, Telescope, TriangleAlert, Wind } from 'lucide-react';
import type { AgroAdvisory, DistrictWeather } from '@/types/weather';
import { AIBadge } from '@/components/ui/Badges';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function AgroWeather({ weather, advisory }: { weather: DistrictWeather; advisory: AgroAdvisory | null }) {
  const { s, locale } = useLocale();

  if (!weather.available && weather.forecast.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
        <CloudRain size={22} className="text-white/30 mx-auto mb-2" aria-hidden="true" />
        <p className="text-white/60 text-sm">{locale === 'rw' ? s.data.unavailable.rw : s.data.unavailable.en}</p>
        <p className="text-white/35 text-xs mt-1">Open-Meteo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Observation — measured, not predicted */}
      {weather.observation && (
        <section aria-labelledby="wx-obs" className="bg-[#0a0e1a] border border-blue-500/20 rounded-2xl p-4">
          <h3 id="wx-obs" className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
            <Eye size={13} aria-hidden="true" />
            {locale === 'rw' ? s.weather.observation.rw : s.weather.observation.en}
            <span className="ml-auto font-normal normal-case tracking-normal text-white/35">
              {weather.observation.source}
            </span>
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white text-4xl font-bold">{Math.round(weather.observation.tempC ?? 0)}°</p>
              <p className="text-white/50 text-sm">{weather.district}</p>
            </div>
            <div className="flex gap-4 text-[13px] text-white/60">
              <span className="flex items-center gap-1.5">
                <Droplets size={14} aria-hidden="true" />{weather.observation.humidityPct ?? '—'}%
              </span>
              <span className="flex items-center gap-1.5">
                <Wind size={14} aria-hidden="true" />{weather.observation.windKph ?? '—'} km/h
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Forecast — estimate with uncertainty */}
      <section aria-labelledby="wx-fc" className="bg-[#0a0e1a] border border-blue-500/20 rounded-2xl p-4">
        <h3 id="wx-fc" className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
          <Telescope size={13} aria-hidden="true" />
          {locale === 'rw' ? s.weather.forecast.rw : s.weather.forecast.en}
          {!weather.available && (
            <span className="ml-auto text-amber-300/80 text-[11px] normal-case tracking-normal">
              {locale === 'rw' ? s.data.stale.rw : s.data.stale.en}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {weather.forecast.map((d) => {
            const wet = (d.precipitationProbability ?? 0) >= 50;
            return (
              <div key={d.date} className="bg-white/5 rounded-xl p-2 text-center">
                <p className="text-white/45 text-[11px] mb-1">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString(locale === 'rw' ? 'rw-RW' : 'en-GB', { weekday: 'short' })}
                </p>
                <CloudRain size={16} className={`mx-auto ${wet ? 'text-blue-400' : 'text-white/25'}`} aria-hidden="true" />
                <p className="text-white text-xs font-semibold mt-1">{Math.round(d.tempMaxC ?? 0)}°</p>
                <p className="text-white/35 text-[11px]">{Math.round(d.tempMinC ?? 0)}°</p>
                <p className={`text-[11px] font-medium mt-0.5 ${wet ? 'text-blue-300' : 'text-white/35'}`}>
                  {d.precipitationProbability ?? '—'}%
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-white/35 text-[11px] mt-2">
          {locale === 'rw'
            ? 'Ijanisha ry’imvura ni ugereranya — si ukuri kwizewe.'
            : 'Rain probabilities are estimates — never certainties.'}
        </p>
      </section>

      {/* AI interpretation — clearly labeled */}
      {advisory && (
        <section aria-labelledby="wx-ai" className="bg-[#0d1a11] border border-[#00c853]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 id="wx-ai" className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest">
              <Sparkles size={13} className="text-[#00c853]" aria-hidden="true" />
              {locale === 'rw' ? s.weather.aiReading.rw : s.weather.aiReading.en}
            </h3>
            <AIBadge ai={advisory.ai} size="xs" />
          </div>
          <p className="text-white/80 text-sm leading-relaxed mb-3">
            {locale === 'rw' ? advisory.rainfallOutlookKiny : advisory.rainfallOutlookEn}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <h4 className="text-white/50 text-xs font-semibold mb-1.5">
                {locale === 'rw' ? s.weather.implications.rw : s.weather.implications.en}
              </h4>
              <ul className="space-y-1.5">
                {(locale === 'rw' ? advisory.implicationsKiny : advisory.implicationsEn).map((t, i) => (
                  <li key={i} className="text-white/75 text-[13px] leading-relaxed">• {t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white/50 text-xs font-semibold mb-1.5">
                {locale === 'rw' ? s.weather.advice.rw : s.weather.advice.en}
              </h4>
              <ul className="space-y-1.5">
                {(locale === 'rw' ? advisory.recommendationsKiny : advisory.recommendationsEn).map((t, i) => (
                  <li key={i} className="text-white/75 text-[13px] leading-relaxed">• {t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="flex items-start gap-1.5 text-amber-200/70 text-xs leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {locale === 'rw' ? advisory.uncertaintyKiny : advisory.uncertaintyEn}
          </p>
        </section>
      )}
    </div>
  );
}
