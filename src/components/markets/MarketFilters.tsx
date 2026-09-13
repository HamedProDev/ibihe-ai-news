'use client';

import { COMMODITY_IDS, COMMODITIES } from '@/lib/market/commodities';
import { useLocale } from '@/components/i18n/LanguageProvider';

export interface FilterValue {
  commodity: string;
  district: string;
  market: string;
  windowDays: number;
}

export function MarketFilters({
  value,
  districts,
  markets,
  onChange,
}: {
  value: FilterValue;
  districts: string[];
  markets: string[];
  onChange: (v: FilterValue) => void;
}) {
  const { t, s, locale } = useLocale();
  const selectCls =
    'bg-ink/5 border border-ink/15 rounded-lg px-2.5 py-2 text-[13px] text-ink focus:outline-none focus:border-brand/60 max-w-full';

  return (
    <div className="flex gap-2 flex-wrap mb-4" role="group" aria-label={t(s.markets.title)}>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-ink/45">{t(s.markets.commodity)}</span>
        <select
          className={selectCls}
          value={value.commodity}
          onChange={(e) => onChange({ ...value, commodity: e.target.value })}
        >
          <option value="">{t(s.markets.all)}</option>
          {COMMODITY_IDS.map((id) => (
            <option key={id} value={id}>
              {locale === 'rw' ? COMMODITIES[id]?.nameKiny : COMMODITIES[id]?.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-ink/45">{t(s.markets.district)}</span>
        <select className={selectCls} value={value.district} onChange={(e) => onChange({ ...value, district: e.target.value })}>
          <option value="">{t(s.markets.all)}</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-ink/45">{t(s.markets.market)}</span>
        <select className={selectCls} value={value.market} onChange={(e) => onChange({ ...value, market: e.target.value })}>
          <option value="">{t(s.markets.all)}</option>
          {markets.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-ink/45">{locale === 'rw' ? 'Igihe' : 'Window'}</span>
        <select
          className={selectCls}
          value={value.windowDays}
          onChange={(e) => onChange({ ...value, windowDays: parseInt(e.target.value, 10) || 30 })}
        >
          <option value={7}>{locale === 'rw' ? 'Iminsi 7' : '7 days'}</option>
          <option value={30}>{locale === 'rw' ? 'Iminsi 30' : '30 days'}</option>
          <option value={90}>{locale === 'rw' ? 'Iminsi 90' : '90 days'}</option>
        </select>
      </label>
    </div>
  );
}
