'use client';
import { NewsArticle } from '@/types';
import { Brain, Clock, Eye, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_COLORS: Record<string, string> = {
  ubuhinzi: 'bg-green-500/20 text-green-400 border-green-500/30',
  politiki: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ubukungu: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ikoranabuhanga: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ubuzima: 'bg-red-500/20 text-red-400 border-red-500/30',
  imikino: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  amahanga: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  ubuhinzi: 'Ubuhinzi', politiki: 'Politiki', ubukungu: 'Ubukungu',
  ikoranabuhanga: 'Ikoranabuhanga', ubuzima: 'Ubuzima',
  imikino: 'Imikino', amahanga: 'Amahanga',
};

function DirectionBadge({ direction, percentChange }: { direction: string; percentChange?: number | null }) {
  const configs = {
    up: { icon: TrendingUp, label: percentChange ? `+${percentChange}%` : 'Hejuru', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    down: { icon: TrendingDown, label: percentChange ? `${percentChange}%` : 'Hasi', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    warning: { icon: AlertTriangle, label: 'Kugenzura', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    neutral: { icon: Minus, label: 'Ruguma', cls: 'bg-white/10 text-white/60 border-white/20' },
  };
  const d = configs[direction as keyof typeof configs] || configs.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${d.cls}`}>
      <d.icon size={10} />
      {d.label}
    </span>
  );
}

export default function NewsCard({ article, variant = 'grid' }: { article: NewsArticle; variant?: 'hero' | 'grid' }) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  const catColor = CATEGORY_COLORS[article.category] || 'bg-white/10 text-white/60 border-white/20';

  if (variant === 'hero') {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-[#00c853]/40 transition-all">
        <div className="h-52 bg-gradient-to-br from-[#00c853]/30 via-[#004d1f] to-[#001a0a] flex items-end p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #00c853 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="flex gap-2 mb-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${catColor}`}>
                {CATEGORY_LABELS[article.category] || article.category}
              </span>
              {article.isAIPrediction && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 px-2 py-0.5 rounded">
                  <Brain size={10} /> AI
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-xl leading-snug">{article.titleKiny}</h2>
          </div>
        </div>
        <div className="p-4 bg-[#0d1a11]">
          <p className="text-white/60 text-sm leading-relaxed mb-3">{article.excerptKiny}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {article.hasPrediction && article.prediction && (
                <DirectionBadge direction={article.prediction.direction} percentChange={article.prediction.percentChange} />
              )}
              {article.isAIPrediction && article.prediction && (
                <span className="text-[11px] text-[#00c853]/70">{article.prediction.confidence}% by'ukuri</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/40 text-xs">
              <span className="flex items-center gap-1"><Clock size={11} />{timeAgo}</span>
              <span className="flex items-center gap-1"><Eye size={11} />{article.views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 hover:bg-[#161616] transition-all cursor-pointer group">
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${catColor}`}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
        {article.isAIPrediction && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20 px-1.5 py-0.5 rounded">
            <Brain size={9} /> AI
          </span>
        )}
      </div>
      <h3 className="text-white text-sm font-medium leading-snug mb-2 group-hover:text-[#00c853] transition-colors">
        {article.titleKiny}
      </h3>
      {article.hasPrediction && article.prediction && (
        <div className="mb-2">
          <DirectionBadge direction={article.prediction.direction} percentChange={article.prediction.percentChange} />
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{article.source}</span>
        <span className="flex items-center gap-1"><Clock size={10} />{timeAgo}</span>
      </div>
    </div>
  );
}
