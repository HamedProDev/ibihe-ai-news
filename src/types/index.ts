/**
 * Central type barrel.
 *
 * Domain types live in focused modules; this file re-exports them and keeps
 * a small number of legacy aliases so existing components keep compiling
 * while they are progressively migrated.
 */
export * from './provenance';
export * from './news';
export * from './market';
export * from './weather';
export * from './forecasting';
export * from './ask';
export * from './api';

import type { Article, NewsCategory } from './news';
import type { Forecast } from './forecasting';
import type { DistrictWeather } from './weather';
import type { MarketObservation } from './market';

/* ------------------------------------------------------------------ */
/* Legacy compatibility (do not use in new code)                       */
/* ------------------------------------------------------------------ */

export type PredictionDirection = 'up' | 'down' | 'neutral' | 'warning';

/** @deprecated Use Article instead. */
export interface NewsArticle {
  id: string;
  title: string;
  titleKiny: string;
  excerpt: string;
  excerptKiny: string;
  category: NewsCategory;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  isAIPrediction: boolean;
  hasPrediction: boolean;
  prediction?: Prediction;
  tags: string[];
  views: number;
}

/** @deprecated Use Forecast instead. */
export interface Prediction {
  id: string;
  topic: string;
  topicKiny: string;
  category: NewsCategory;
  direction: PredictionDirection;
  summary: string;
  summaryKiny: string;
  currentValue?: string;
  predictedValue?: string;
  percentChange?: number;
  confidence: number;
  timeframe: string;
  generatedAt: string;
  sources: string[];
}

/** @deprecated Use DistrictWeather instead. */
export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  descriptionKiny: string;
  humidity: number;
  wind: number;
  forecast: WeatherDay[];
}

/** @deprecated */
export interface WeatherDay {
  day: string;
  dayKiny: string;
  high: number;
  low: number;
  icon: string;
}

/** @deprecated Use MarketObservation instead. */
export interface MarketPrice {
  item: string;
  itemKiny: string;
  currentPrice: number;
  unit: string;
  market: string;
  change: number;
  changePercent: number;
}

/** Adapt a new Article to the legacy NewsArticle shape for old components. */
export function toLegacyArticle(a: Article): NewsArticle {
  const primary = a.sources[0];
  return {
    id: a.id,
    title: a.title,
    titleKiny: a.titleKiny,
    excerpt: a.excerpt,
    excerptKiny: a.excerptKiny,
    category: a.category,
    source: primary?.name ?? 'Ibihe',
    sourceUrl: primary?.url ?? '#',
    imageUrl: a.imageUrl,
    publishedAt: a.publishedAt,
    isAIPrediction: a.status === 'forecast',
    hasPrediction: a.status === 'forecast',
    tags: a.tags,
    views: a.views,
  };
}

/** Adapt a new Forecast to the legacy Prediction shape. */
export function toLegacyPrediction(f: Forecast): Prediction {
  return {
    id: f.id,
    topic: f.questionEn,
    topicKiny: f.questionKiny,
    category: 'ubuhinzi',
    direction:
      f.direction === 'up' ? 'up' : f.direction === 'down' ? 'down' : 'neutral',
    summary: f.evidenceEn[0] ?? f.questionEn,
    summaryKiny: f.evidenceKiny[0] ?? f.questionKiny,
    currentValue:
      f.baselinePricePerKg != null ? `${Math.round(f.baselinePricePerKg)} RWF/kg` : undefined,
    predictedValue: f.predictedRangePerKg
      ? `${Math.round(f.predictedRangePerKg.low)}–${Math.round(f.predictedRangePerKg.high)} RWF/kg`
      : undefined,
    percentChange: undefined,
    confidence: f.confidence,
    timeframe: f.horizon === '7d' ? 'Mu minsi 7' : f.horizon === '14d' ? 'Mu minsi 14' : 'Mu minsi 30',
    generatedAt: f.createdAt,
    sources: ['Ibihe Baseline ' + f.modelVersion],
  };
}

/** Adapt district weather to the legacy widget shape (observation only). */
export function toLegacyWeather(w: DistrictWeather): WeatherData {
  const dayNames: Record<string, string> = {
    '0': 'Ku cyumweru',
    '1': 'Ku wa mbere',
    '2': 'Ku wa kabiri',
    '3': 'Ku wa gatatu',
    '4': 'Ku wa kane',
    '5': 'Ku wa gatanu',
    '6': 'Ku wa gatandatu',
  };
  return {
    city: w.district,
    temp: Math.round(w.observation?.tempC ?? w.forecast[0]?.tempMaxC ?? 0),
    description: 'Live data',
    descriptionKiny:
      (w.forecast[0]?.precipitationProbability ?? 0) >= 50
        ? 'Imvura irashoboka'
        : 'Hakabona, nta mvura nyinshi',
    humidity: Math.round(w.observation?.humidityPct ?? 0),
    wind: Math.round(w.observation?.windKph ?? 0),
    forecast: w.forecast.slice(0, 3).map((d) => ({
      day: d.date,
      dayKiny: dayNames[String(new Date(d.date + 'T12:00:00').getDay())] ?? d.date,
      high: Math.round(d.tempMaxC ?? 0),
      low: Math.round(d.tempMinC ?? 0),
      icon: (d.precipitationProbability ?? 0) >= 50 ? 'rain' : 'sun',
    })),
  };
}

/** Adapt latest observations to the legacy ticker shape. */
export function toLegacyMarketPrices(
  obs: MarketObservation[],
  names: Record<string, { kiny: string; en: string }>,
): MarketPrice[] {
  const seen = new Set<string>();
  const out: MarketPrice[] = [];
  for (const o of obs) {
    if (seen.has(o.commodity)) continue;
    seen.add(o.commodity);
    const n = names[o.commodity] ?? { kiny: o.commodity, en: o.commodity };
    out.push({
      item: n.en,
      itemKiny: n.kiny,
      currentPrice: Math.round(o.pricePerKg ?? o.price),
      unit: 'kg',
      market: o.market,
      change: 0,
      changePercent: 0,
    });
  }
  return out;
}
