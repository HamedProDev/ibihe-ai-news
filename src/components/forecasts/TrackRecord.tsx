'use client';

import { Award } from 'lucide-react';
import type { TrackRecord as TrackRecordData } from '@/types/forecasting';
import { COMMODITIES } from '@/lib/market/commodities';
import { useLocale } from '@/components/i18n/LanguageProvider';

function pct(v: number | null): string {
  return v == null ? '—' : `${v}%`;
}

export function TrackRecord({ record }: { record: TrackRecordData }) {
  const { s, locale } = useLocale();
  return (
    <section aria-labelledby="tr-h" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5">
      <h2 id="tr-h" className="flex items-center gap-2 text-white text-[15px] font-bold mb-1">
        <Award size={16} className="text-[#00c853]" aria-hidden="true" />
        {locale === 'rw' ? s.forecasts.trackRecord.rw : s.forecasts.trackRecord.en}
      </h2>
      <p className="text-white/40 text-xs mb-4">
        {record.totalForecasts} {locale === 'rw' ? 'byahanuwe' : 'forecasts'}
        {' · '}
        {record.evaluated} {locale === 'rw' ? s.forecasts.evaluated.rw : s.forecasts.evaluated.en}
        {' · '}
        {record.pending} {locale === 'rw' ? s.forecasts.pending.rw : s.forecasts.pending.en}
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-white/45 text-xs mb-1">{locale === 'rw' ? s.forecasts.accuracy.rw : s.forecasts.accuracy.en}</p>
          <p className="text-white text-2xl font-bold">{pct(record.accuracy)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/45 text-xs mb-2">{locale === 'rw' ? 'Ukuri ku gicuruzwa' : 'By commodity'}</p>
          <ul className="space-y-1 text-[13px]">
            {record.byCommodity.map((b) => (
              <li key={b.commodity} className="flex justify-between text-white/75">
                <span>{locale === 'rw' ? COMMODITIES[b.commodity]?.nameKiny : COMMODITIES[b.commodity]?.nameEn}</span>
                <span className="font-medium">{pct(b.accuracy)} <span className="text-white/35">({b.evaluated})</span></span>
              </li>
            ))}
            {record.byCommodity.length === 0 && <li className="text-white/35">—</li>}
          </ul>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/45 text-xs mb-2">{locale === 'rw' ? 'Ukuri ku gihe' : 'By horizon'}</p>
          <ul className="space-y-1 text-[13px]">
            {record.byHorizon.map((b) => (
              <li key={b.horizon} className="flex justify-between text-white/75">
                <span>{b.horizon === '7d' ? (locale === 'rw' ? 'Iminsi 7' : '7 days') : b.horizon === '14d' ? (locale === 'rw' ? 'Iminsi 14' : '14 days') : (locale === 'rw' ? 'Iminsi 30' : '30 days')}</span>
                <span className="font-medium">{pct(b.accuracy)} <span className="text-white/35">({b.evaluated})</span></span>
              </li>
            ))}
            {record.byHorizon.length === 0 && <li className="text-white/35">—</li>}
          </ul>
        </div>
      </div>

      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
        Calibration — {locale === 'rw' ? 'amahirwe twavuze vs ibyabaye' : 'stated probability vs outcomes'}
      </h3>
      <div className="space-y-2">
        {record.calibration.map((c) => (
          <div key={c.bin} className="flex items-center gap-3 text-xs">
            <span className="text-white/50 w-16 shrink-0">{c.bin}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00c853] rounded-full"
                style={{ width: `${c.observed ?? 0}%` }}
                role="progressbar"
                aria-valuenow={c.observed ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.bin}: ${pct(c.observed)}`}
              />
            </div>
            <span className="text-white/70 w-20 text-right shrink-0">
              {pct(c.observed)} <span className="text-white/35">({c.count})</span>
            </span>
          </div>
        ))}
      </div>
      <p className="text-white/35 text-[11px] mt-3">
        {locale === 'rw'
          ? 'Ibihe ntirivuga nimero imwe y’“ukuri kwa AI”. Ahubwo yerekana uko buri cyitegererezo cyagiye cyigenza — kugira ngo wifatie icyemezo ushingiye ku bimenyetso.'
          : 'Ibihe does not advertise one “AI accuracy” number. It shows how each model version actually performed — so you can judge with evidence.'}
      </p>
    </section>
  );
}
