'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, FlaskConical, TrendingDown, TrendingUp, Minus, XCircle } from 'lucide-react';
import type { Forecast } from '@/types/forecasting';
import { COMMODITIES } from '@/lib/market/commodities';
import { ContentStatusBadge } from '@/components/ui/Badges';
import { useLocale } from '@/components/i18n/LanguageProvider';

function DirectionIcon({ d }: { d: Forecast['direction'] }) {
  if (d === 'up') return <TrendingUp size={16} className="text-green-400" aria-hidden="true" />;
  if (d === 'down') return <TrendingDown size={16} className="text-red-400" aria-hidden="true" />;
  return <Minus size={16} className="text-white/50" aria-hidden="true" />;
}

export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const { s, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const name = locale === 'rw' ? COMMODITIES[forecast.commodity]?.nameKiny : COMMODITIES[forecast.commodity]?.nameEn;
  const horizonLabel = forecast.horizon === '7d'
    ? locale === 'rw' ? 'iminsi 7' : '7 days'
    : forecast.horizon === '14d'
      ? locale === 'rw' ? 'iminsi 14' : '14 days'
      : locale === 'rw' ? 'iminsi 30' : '30 days';

  return (
    <article className="bg-[#0d141b] border border-cyan-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <ContentStatusBadge status="forecast" size="xs" />
        {forecast.isMock && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">
            <FlaskConical size={10} aria-hidden="true" /> demo
          </span>
        )}
        <span className="ml-auto text-[11px] text-white/35">{forecast.modelVersion}</span>
      </div>

      <h3 className="text-white font-semibold text-[15px] leading-snug">
        {name} — {horizonLabel} {locale === 'rw' ? s.forecasts.outlook.rw : s.forecasts.outlook.en}
      </h3>

      <div className="flex items-center gap-3 my-3">
        <DirectionIcon d={forecast.direction} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-white text-xl font-bold">{forecast.probability}%</span>
            <span className="text-white/40 text-xs">
              {locale === 'rw' ? s.forecasts.probability.rw : s.forecasts.probability.en}
              {' · '}
              {locale === 'rw' ? s.forecasts.confidence.rw : s.forecasts.confidence.en}: {forecast.confidence}%
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={forecast.probability} aria-valuemin={0} aria-valuemax={100} aria-label={`${forecast.probability}%`}>
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${forecast.probability}%` }} />
          </div>
        </div>
      </div>

      <p className="text-white/60 text-[13px] leading-relaxed">
        {locale === 'rw' ? s.forecasts.basedOn.rw : s.forecasts.basedOn.en}
      </p>
      {forecast.predictedRangePerKg && (
        <p className="text-white/70 text-[13px] mt-1.5">
          {forecast.predictedRangePerKg.low.toLocaleString('en-US')}–{forecast.predictedRangePerKg.high.toLocaleString('en-US')} RWF/kg
          {forecast.baselinePricePerKg != null && (
            <span className="text-white/40"> ({locale === 'rw' ? 'fatizo' : 'baseline'}: {forecast.baselinePricePerKg.toLocaleString('en-US')})</span>
          )}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 text-xs">
        {forecast.evaluation === 'pending' ? (
          <span className="inline-flex items-center gap-1 text-white/45">
            <Clock3 size={12} aria-hidden="true" />
            {locale === 'rw' ? s.forecasts.pending.rw : s.forecasts.pending.en}
            {' · '}
            {forecast.resolvesAt.slice(0, 10)}
          </span>
        ) : forecast.evaluation === 'correct' ? (
          <span className="inline-flex items-center gap-1 text-green-400 font-medium">
            <CheckCircle2 size={13} aria-hidden="true" />
            {locale === 'rw' ? 'Byahuye n’ibyabaye' : 'Matched outcome'}
          </span>
        ) : forecast.evaluation === 'incorrect' ? (
          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
            <XCircle size={13} aria-hidden="true" />
            {locale === 'rw' ? 'Byatandukanye n’ibyabaye' : 'Missed outcome'}
          </span>
        ) : (
          <span className="text-white/40">{locale === 'rw' ? 'Ntiryasuzumwe' : 'Void'}</span>
        )}
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-[#00c853] text-[13px] font-medium hover:underline"
      >
        {locale === 'rw' ? 'Bishingiye kuri, ibyizerwa n’ibyabyoshya' : 'Evidence, assumptions & invalidators'}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-[13px]">
          <div>
            <h4 className="text-white/50 font-semibold text-xs mb-1">{locale === 'rw' ? s.forecasts.evidence.rw : s.forecasts.evidence.en}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.evidenceKiny : forecast.evidenceEn).map((t, i) => <li key={i} className="text-white/75">• {t}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-white/50 font-semibold text-xs mb-1">{locale === 'rw' ? s.forecasts.assumptions.rw : s.forecasts.assumptions.en}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.assumptionsKiny : forecast.assumptionsEn).map((t, i) => <li key={i} className="text-white/75">• {t}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-white/50 font-semibold text-xs mb-1">{locale === 'rw' ? s.forecasts.invalidators.rw : s.forecasts.invalidators.en}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.invalidatorsKiny : forecast.invalidatorsEn).map((t, i) => <li key={i} className="text-white/75">• {t}</li>)}</ul>
          </div>
          {forecast.outcome && (
            <p className="text-white/50 text-xs border-t border-white/10 pt-2">
              {locale === 'rw' ? forecast.outcome.noteKiny : forecast.outcome.noteEn}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
