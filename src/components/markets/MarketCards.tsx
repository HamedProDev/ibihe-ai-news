'use client';

import Link from 'next/link';
import { TrendingDown, TrendingUp, Minus, HelpCircle } from 'lucide-react';
import type { MarketTrend } from '@/types/market';
import { COMMODITIES } from '@/lib/market/commodities';
import { Sparkline } from '@/components/ui/Sparkline';
import { DemoBanner } from '@/components/ui/Badges';
import { useLocale } from '@/components/i18n/LanguageProvider';

function TrendIcon({ direction }: { direction: MarketTrend['direction'] }) {
  if (direction === 'up') return <TrendingUp size={13} className="text-green-400" aria-hidden="true" />;
  if (direction === 'down') return <TrendingDown size={13} className="text-red-400" aria-hidden="true" />;
  if (direction === 'flat') return <Minus size={13} className="text-white/40" aria-hidden="true" />;
  return <HelpCircle size={13} className="text-white/30" aria-hidden="true" />;
}

export function MarketTrendCard({ trend }: { trend: MarketTrend }) {
  const { locale } = useLocale();
  const info = COMMODITIES[trend.commodity];
  const name = locale === 'rw' ? info?.nameKiny : info?.nameEn;
  const stroke = trend.direction === 'up' ? '#22c55e' : trend.direction === 'down' ? '#ef4444' : '#00c853';

  return (
    <Link
      href={`/isoko/${trend.commodity}`}
      className="block bg-[#111] border border-white/10 rounded-2xl p-4 hover:border-[#00c853]/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-semibold text-[15px]">{name}</h3>
        <span className="flex items-center gap-1 text-xs font-medium text-white/60">
          <TrendIcon direction={trend.direction} />
          {trend.changePercent != null ? `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%` : '—'}
        </span>
      </div>
      <p className="text-white/40 text-xs mb-2">
        {trend.market ?? trend.district ?? (locale === 'rw' ? 'Amisoko yose' : 'All markets')}
        {' · '}
        {trend.observations} {locale === 'rw' ? 'bipimo' : 'obs.'}
      </p>
      <p className="text-white text-lg font-bold mb-2">
        {trend.latestPricePerKg != null ? `${trend.latestPricePerKg.toLocaleString('en-US')} RWF` : '—'}
        <span className="text-white/40 text-xs font-normal"> /kg</span>
      </p>
      <Sparkline points={trend.series.slice(-30)} width={200} height={48} stroke={stroke} />
      {trend.dataMode === 'demo' && (
        <p className="text-amber-300/70 text-[11px] mt-2">demo</p>
      )}
    </Link>
  );
}

export function MarketSnapshot({ trends, dataMode }: { trends: MarketTrend[]; dataMode: 'live' | 'demo' | 'mixed' }) {
  const { t, s } = useLocale();
  return (
    <div>
      <DemoBanner mode={dataMode} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {trends.slice(0, 6).map((t) => (
          <MarketTrendCard key={`${t.commodity}-${t.market ?? ''}-${t.district ?? ''}`} trend={t} />
        ))}
      </div>
      <p className="sr-only">{t(s.markets.title)}</p>
    </div>
  );
}
