'use client';
import { useState } from 'react';
import { useNews, usePredictions, useMarket } from '@/hooks/useNews';
import NewsCard from '@/components/news/NewsCard';
import PredictionPanel from '@/components/predictions/PredictionPanel';
import WeatherWidget from '@/components/weather/WeatherWidget';
import MarketTicker from '@/components/predictions/MarketTicker';
import { Brain, Flame, Filter } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'Byose' },
  { key: 'ubuhinzi', label: 'Ubuhinzi' },
  { key: 'politiki', label: 'Politiki' },
  { key: 'ubukungu', label: 'Ubukungu' },
  { key: 'ikoranabuhanga', label: 'Ikoranabuhanga' },
  { key: 'ubuzima', label: 'Ubuzima' },
  { key: 'amahanga', label: 'Amahanga' },
];

const TRENDING = [
  'Ibirayi: ibiciro bigwa 5%?',
  'Amerika na intambara yo guhagarika',
  'MTN 5G Kigali: ubwangu bushya',
  'USD/RWF: ifaranga riguma',
  'Ibishyimbo Nyagatare: amahirwe mashya',
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { articles, loading: newsLoading } = useNews(activeCategory === 'all' ? undefined : activeCategory);
  const { predictions, loading: predLoading } = usePredictions();
  const { prices, weather, loading: marketLoading } = useMarket();

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 5);
  const listArticles = articles.slice(5);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10">
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeCategory === cat.key
                ? 'bg-[#00c853] text-black border-[#00c853]'
                : 'bg-transparent text-white/60 border-white/15 hover:border-white/30 hover:text-white'
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div>
          {/* Hero */}
          {heroArticle && !newsLoading && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-[#00c853]" />
                <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Inkuru Nkuru</span>
              </div>
              <NewsCard article={heroArticle} variant="hero" />
            </div>
          )}

          {/* AI Predictions highlight bar */}
          {!predLoading && predictions.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-[#00c853]/10 to-transparent border border-[#00c853]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-[#00c853]" />
                <span className="text-[#00c853] text-sm font-semibold">Ibyahanuwe na AI — Uyu Munsi</span>
                <span className="ml-auto text-[11px] text-white/40">Ibyahanuwe bishingiye ku makuru</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {predictions.slice(0, 3).map(pred => (
                  <div key={pred.id} className="bg-black/20 rounded-lg p-3">
                    <p className="text-white/60 text-xs mb-1 truncate">{pred.topicKiny}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">
                        {pred.percentChange ? `${pred.percentChange > 0 ? '+' : ''}${pred.percentChange}%` : pred.timeframe}
                      </span>
                      <span className="text-[10px] text-white/40">{pred.confidence}% ukuri</span>
                    </div>
                    {pred.predictedValue && (
                      <p className={`text-xs font-medium mt-1 ${pred.direction === 'down' ? 'text-red-400' : pred.direction === 'up' ? 'text-green-400' : 'text-amber-400'}`}>
                        → {pred.predictedValue}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid articles */}
          {!newsLoading && gridArticles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} className="text-white/40" />
                <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Inkuru Zihambaye</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gridArticles.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {/* List articles */}
          {!newsLoading && listArticles.length > 0 && (
            <div className="space-y-2">
              {listArticles.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {newsLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Predictions */}
          {!predLoading && predictions.length > 0 && (
            <PredictionPanel predictions={predictions} />
          )}

          {/* Weather */}
          {!marketLoading && weather && (
            <WeatherWidget weather={weather} />
          )}

          {/* Market prices */}
          {!marketLoading && prices.length > 0 && (
            <MarketTicker prices={prices} />
          )}

          {/* Trending */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Flame size={14} className="text-orange-400" />
              Ibiganirwaho Cyane
            </h3>
            <div className="space-y-1">
              {TRENDING.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer group">
                  <span className="text-white/20 text-sm font-bold w-5 shrink-0">{i + 1}</span>
                  <span className="text-white/70 text-sm group-hover:text-[#00c853] transition-colors leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
