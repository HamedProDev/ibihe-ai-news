'use client';

import type { MarketObservation } from '@/types/market';
import { COMMODITIES } from '@/lib/market/commodities';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function ObservationTable({ observations }: { observations: MarketObservation[] }) {
  const { locale } = useLocale();
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10">
      <table className="w-full text-left text-[13px] min-w-[640px]">
        <thead>
          <tr className="bg-ink/5 text-ink/50">
            <th scope="col" className="px-3 py-2.5 font-medium">{locale === 'rw' ? 'Igicuruzwa' : 'Commodity'}</th>
            <th scope="col" className="px-3 py-2.5 font-medium">{locale === 'rw' ? 'Igiciro' : 'Price'}</th>
            <th scope="col" className="px-3 py-2.5 font-medium">RWF/kg</th>
            <th scope="col" className="px-3 py-2.5 font-medium">{locale === 'rw' ? 'Isoko' : 'Market'}</th>
            <th scope="col" className="px-3 py-2.5 font-medium">{locale === 'rw' ? 'Byabonwe' : 'Observed'}</th>
            <th scope="col" className="px-3 py-2.5 font-medium">{locale === 'rw' ? 'Inkomoko' : 'Source'}</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((o) => (
            <tr key={o.id} className="border-t border-ink/5 text-ink/80">
              <td className="px-3 py-2.5 font-medium text-ink">
                {locale === 'rw' ? COMMODITIES[o.commodity]?.nameKiny : COMMODITIES[o.commodity]?.nameEn}
                {o.isMock && <span className="ml-1.5 text-[10px] text-warn/70">demo</span>}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {o.price.toLocaleString('en-US')} RWF<span className="text-ink/40">/{o.unit}</span>
              </td>
              <td className="px-3 py-2.5">{o.pricePerKg != null ? o.pricePerKg.toLocaleString('en-US') : '—'}</td>
              <td className="px-3 py-2.5">{o.market} <span className="text-ink/40">({o.district})</span></td>
              <td className="px-3 py-2.5 whitespace-nowrap text-ink/60">{o.observedAt.slice(0, 10)}</td>
              <td className="px-3 py-2.5 text-ink/60">{o.source.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
