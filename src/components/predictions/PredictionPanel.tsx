'use client';
import { Prediction } from '@/types';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronRight } from 'lucide-react';

const DIRECTION_CONFIG = {
  up: { icon: TrendingUp, color: 'text-green-400', barColor: 'bg-green-500', badge: 'bg-green-500/20 text-green-400 border-green-500/30', arrow: '↑' },
  down: { icon: TrendingDown, color: 'text-red-400', barColor: 'bg-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/30', arrow: '↓' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', barColor: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', arrow: '?' },
  neutral: { icon: Minus, color: 'text-white/60', barColor: 'bg-white/30', badge: 'bg-white/10 text-white/60 border-white/20', arrow: '—' },
};

function PredictionItem({ prediction }: { prediction: Prediction }) {
  const cfg = DIRECTION_CONFIG[prediction.direction] || DIRECTION_CONFIG.neutral;
  return (
    <div className="py-3 border-b border-white/5 last:border-0 last:pb-0 group cursor-pointer hover:bg-white/2 -mx-1 px-1 rounded transition-all">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-white/70 text-xs leading-snug">{prediction.topicKiny}</p>
        <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.badge}`}>
          {cfg.arrow} {prediction.percentChange ? `${Math.abs(prediction.percentChange)}%` : ''}
        </span>
      </div>
      {(prediction.currentValue || prediction.predictedValue) && (
        <div className="flex items-center gap-2 mb-1.5 text-xs">
          {prediction.currentValue && <span className="text-white/40">{prediction.currentValue}</span>}
          {prediction.predictedValue && (
            <>
              <ChevronRight size={10} className="text-white/20" />
              <span className={`font-medium ${cfg.color}`}>{prediction.predictedValue}</span>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cfg.barColor}`} style={{ width: `${prediction.confidence}%` }} />
        </div>
        <span className="text-[10px] text-white/40 shrink-0">{prediction.confidence}%</span>
        <span className="text-[10px] text-white/30 shrink-0">{prediction.timeframe}</span>
      </div>
    </div>
  );
}

export default function PredictionPanel({ predictions }: { predictions: Prediction[] }) {
  return (
    <div className="bg-[#0d1a11] border border-[#00c853]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-[#00c853]/20 rounded-lg flex items-center justify-center">
          <Brain size={14} className="text-[#00c853]" />
        </div>
        <div>
          <h3 className="text-white text-sm font-semibold">Ibyahanuwe na AI</h3>
          <p className="text-white/40 text-[11px]">Guhanuriwa kw'igihe</p>
        </div>
        <span className="ml-auto w-2 h-2 bg-[#00c853] rounded-full animate-pulse" />
      </div>
      <div>
        {predictions.map(p => <PredictionItem key={p.id} prediction={p} />)}
      </div>
    </div>
  );
}
