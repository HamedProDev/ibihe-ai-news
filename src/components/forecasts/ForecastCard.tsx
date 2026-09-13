'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, FlaskConical, TrendingDown, TrendingUp, Minus, XCircle } from 'lucide-react';
import type { Forecast } from '@/types/forecasting';
import { COMMODITIES } from '@/lib/market/commodities';
import { ContentStatusBadge } from '@/components/ui/Badges';
import { useLocale } from '@/components/i18n/LanguageProvider';

function DirectionIcon({ d }: { d: Forecast['direction'] }) {
  if (d === 'up') return <TrendingUp size={16} className="text-ok" aria-hidden="true" />;
  if (d === 'down') return <TrendingDown size={16} className="text-danger" aria-hidden="true" />;
  return <Minus size={16} className="text-ink/50" aria-hidden="true" />;
}

export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const { t, s, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const name = locale === 'rw' ? COMMODITIES[forecast.commodity]?.nameKiny : COMMODITIES[forecast.commodity]?.nameEn;
  const horizonLabel = forecast.horizon === '7d'
    ? locale === 'rw' ? 'iminsi 7' : '7 days'
    : forecast.horizon === '14d'
      ? locale === 'rw' ? 'iminsi 14' : '14 days'
      : locale === 'rw' ? 'iminsi 30' : '30 days';

  return (
    <article className="bg-info/10 border border-cyan-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <ContentStatusBadge status="forecast" size="xs" />
        {forecast.isMock && (
          <span className="inline-flex items-center gap-1 text-[10px] text-warn/80 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">
            <FlaskConical size={10} aria-hidden="true" /> demo
          </span>
        )}
        <span className="ml-auto text-[11px] text-ink/35">{forecast.modelVersion}</span>
      </div>

      <h3 className="text-ink font-semibold text-[15px] leading-snug">
        {name} — {horizonLabel} {t(s.forecasts.outlook)}
      </h3>

      <div className="flex items-center gap-3 my-3">
        <DirectionIcon d={forecast.direction} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-ink text-xl font-bold">{forecast.probability}%</span>
            <span className="text-ink/40 text-xs">
              {t(s.forecasts.probability)}
              {' · '}
              {t(s.forecasts.confidence)}: {forecast.confidence}%
            </span>
          </div>
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={forecast.probability} aria-valuemin={0} aria-valuemax={100} aria-label={`${forecast.probability}%`}>
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${forecast.probability}%` }} />
          </div>
        </div>
      </div>

      <p className="text-ink/60 text-[13px] leading-relaxed">
        {t(s.forecasts.basedOn)}
      </p>
      {forecast.predictedRangePerKg && (
        <p className="text-ink/70 text-[13px] mt-1.5">
          {forecast.predictedRangePerKg.low.toLocaleString('en-US')}–{forecast.predictedRangePerKg.high.toLocaleString('en-US')} RWF/kg
          {forecast.baselinePricePerKg != null && (
            <span className="text-ink/40"> ({locale === 'rw' ? 'fatizo' : 'baseline'}: {forecast.baselinePricePerKg.toLocaleString('en-US')})</span>
          )}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 text-xs">
        {forecast.evaluation === 'pending' ? (
          <span className="inline-flex items-center gap-1 text-ink/45">
            <Clock3 size={12} aria-hidden="true" />
            {t(s.forecasts.pending)}
            {' · '}
            {forecast.resolvesAt.slice(0, 10)}
          </span>
        ) : forecast.evaluation === 'correct' ? (
          <span className="inline-flex items-center gap-1 text-ok font-medium">
            <CheckCircle2 size={13} aria-hidden="true" />
            {locale === 'rw' ? 'Byahuye n’ibyabaye' : 'Matched outcome'}
          </span>
        ) : forecast.evaluation === 'incorrect' ? (
          <span className="inline-flex items-center gap-1 text-danger font-medium">
            <XCircle size={13} aria-hidden="true" />
            {locale === 'rw' ? 'Byatandukanye n’ibyabaye' : 'Missed outcome'}
          </span>
        ) : (
          <span className="text-ink/40">{locale === 'rw' ? 'Ntiryasuzumwe' : 'Void'}</span>
        )}
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-brand-ink text-[13px] font-medium hover:underline"
      >
        {locale === 'rw' ? 'Bishingiye kuri, ibyizerwa n’ibyabyoshya' : 'Evidence, assumptions & invalidators'}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-[13px]">
          <div>
            <h4 className="text-ink/50 font-semibold text-xs mb-1">{t(s.forecasts.evidence)}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.evidenceKiny : forecast.evidenceEn).map((t, i) => <li key={i} className="text-ink/75">• {t}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-ink/50 font-semibold text-xs mb-1">{t(s.forecasts.assumptions)}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.assumptionsKiny : forecast.assumptionsEn).map((t, i) => <li key={i} className="text-ink/75">• {t}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-ink/50 font-semibold text-xs mb-1">{t(s.forecasts.invalidators)}</h4>
            <ul className="space-y-1">{(locale === 'rw' ? forecast.invalidatorsKiny : forecast.invalidatorsEn).map((t, i) => <li key={i} className="text-ink/75">• {t}</li>)}</ul>
          </div>
          {forecast.outcome && (
            <p className="text-ink/50 text-xs border-t border-ink/10 pt-2">
              {locale === 'rw' ? forecast.outcome.noteKiny : forecast.outcome.noteEn}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
