import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMMODITIES, COMMODITY_IDS } from '@/lib/market/commodities';
import { queryMarket } from '@/lib/market/store';
import { listForecasts } from '@/lib/forecasting/store';
import { ObservationTable } from '@/components/markets/ObservationTable';
import { ForecastCard } from '@/components/forecasts/ForecastCard';
import { Sparkline } from '@/components/ui/Sparkline';
import { DemoBanner } from '@/components/ui/Badges';
import type { CommodityId } from '@/types/market';

export async function generateMetadata({ params }: { params: Promise<{ commodity: string }> }): Promise<Metadata> {
  const { commodity } = await params;
  const info = (COMMODITIES as Record<string, { nameKiny: string; nameEn: string }>)[commodity];
  if (!info) return { title: 'Ntibonetse' };
  return {
    title: `${info.nameKiny} — Isoko`,
    description: `Ibiciro bya ${info.nameKiny} ku masoko, umurongo w’igihe, n’ihanura. ${info.nameEn} prices, trends and forecasts.`,
  };
}

export default async function CommodityPage({ params }: { params: Promise<{ commodity: string }> }) {
  const { commodity } = await params;
  if (!COMMODITY_IDS.includes(commodity as CommodityId)) notFound();
  const id = commodity as CommodityId;
  const info = COMMODITIES[id];
  if (!info) notFound();

  const [market, fc] = await Promise.all([
    queryMarket({ commodity: id, windowDays: 60, limit: 60 }),
    listForecasts({ commodity: id }),
  ]);
  const trend = market.trends[0];
  const pending = fc.forecasts.filter((f) => f.evaluation === 'pending').slice(0, 3);

  return (
    <main className="x-container py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink/45 mb-3">
        <Link href="/isoko" className="hover:text-brand-ink">Isoko</Link>
        {' / '}
        <span className="text-ink/70">{info.nameKiny}</span>
      </nav>

      <h1 className="text-ink text-2xl font-bold">{info.nameKiny}</h1>
      <p className="text-ink/50 text-sm mb-5">{info.nameEn}</p>

      <DemoBanner mode={market.dataMode} />

      {trend && trend.series.length > 1 && (
        <section aria-label="Umurongo w’ibiciro" className="bg-surface border border-ink/10 rounded-2xl p-4 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-ink text-2xl font-bold">
              {trend.latestPricePerKg?.toLocaleString('en-US')} <span className="text-sm font-normal text-ink/45">RWF/kg</span>
            </p>
            <p className={`text-sm font-semibold ${trend.direction === 'up' ? 'text-ok' : trend.direction === 'down' ? 'text-danger' : 'text-ink/50'}`}>
              {trend.changePercent != null ? `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%` : '—'}
              <span className="text-ink/35 font-normal"> / {trend.windowDays}d</span>
            </p>
          </div>
          <Sparkline points={trend.series} width={640} height={120} />
          <p className="text-ink/35 text-xs mt-2">
            Ingero z’aho: {info.localUnits.map((u) => u.unitKiny).join(', ')} · {trend.observations} bipimo
          </p>
        </section>
      )}

      {pending.length > 0 && (
        <section aria-labelledby="comm-fc" className="mb-6">
          <h2 id="comm-fc" className="text-ink text-[15px] font-bold mb-3">Ibiteganyijwe — Forecasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pending.map((f) => <ForecastCard key={f.id} forecast={f} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="comm-obs">
        <h2 id="comm-obs" className="text-ink text-[15px] font-bold mb-3">Ibipimo — Observations ({market.observations.length})</h2>
        {market.observations.length > 0 ? (
          <ObservationTable observations={market.observations} />
        ) : (
          <p className="text-ink/50 text-sm">Nta bipimo bibonetse.</p>
        )}
      </section>
    </main>
  );
}
