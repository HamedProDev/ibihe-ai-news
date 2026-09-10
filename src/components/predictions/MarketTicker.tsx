'use client';
import { MarketPrice } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MarketTicker({ prices }: { prices: MarketPrice[] }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
      <h3 className="text-white text-sm font-semibold mb-3">Isoko — Ibiciro Bihoraho</h3>
      <div className="space-y-2">
        {prices.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <div>
              <span className="text-white text-sm font-medium">{p.itemKiny}</span>
              <span className="text-white/40 text-xs ml-2">{p.market}</span>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-white text-sm font-medium">{p.currentPrice.toLocaleString()} Fr/{p.unit}</span>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                p.changePercent > 0 ? 'text-green-400' : p.changePercent < 0 ? 'text-red-400' : 'text-white/40'
              }`}>
                {p.changePercent > 0 ? <TrendingUp size={11} /> : p.changePercent < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                {p.changePercent > 0 ? '+' : ''}{p.changePercent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
