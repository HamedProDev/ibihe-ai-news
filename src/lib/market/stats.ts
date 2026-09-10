/**
 * Market statistics — pure functions over observations.
 * Simple moving averages, % change, trend direction. No forecasting here
 * (that lives in src/lib/forecasting).
 */
import type { MarketObservation, MarketTrend } from '../../types/market';
import type { CommodityId } from '../../types/market';

export function movingAverage(values: number[], window: number): number | null {
  if (values.length < window || window <= 0) return null;
  const slice = values.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function percentChange(from: number | null, to: number | null): number | null {
  if (from == null || to == null || from === 0) return null;
  return ((to - from) / from) * 100;
}

export function directionOf(changePct: number | null, flatBand = 1.5): MarketTrend['direction'] {
  if (changePct == null) return 'unknown';
  if (Math.abs(changePct) < flatBand) return 'flat';
  return changePct > 0 ? 'up' : 'down';
}

export interface TrendOptions {
  windowDays?: number;
  market?: string;
  district?: string;
  now?: Date;
}

/** Build a trend summary for one commodity from its observations. */
export function buildTrend(
  commodity: CommodityId,
  observations: MarketObservation[],
  options: TrendOptions = {},
): MarketTrend {
  const { windowDays = 30, market, district, now = new Date() } = options;
  const cutoff = now.getTime() - windowDays * 24 * 3600_000;
  const rows = observations
    .filter((o) => o.commodity === commodity)
    .filter((o) => (market ? o.market === market : true))
    .filter((o) => (district ? o.district === district : true))
    .filter((o) => o.pricePerKg != null)
    .filter((o) => new Date(o.observedAt).getTime() >= cutoff)
    .sort((a, b) => +new Date(a.observedAt) - +new Date(b.observedAt));

  const series = rows.map((o) => ({ at: o.observedAt, pricePerKg: o.pricePerKg as number }));
  const half = Math.floor(rows.length / 2);
  const firstHalf = rows.slice(0, half).map((o) => o.pricePerKg as number);
  const secondHalf = rows.slice(half).map((o) => o.pricePerKg as number);
  const prevAvg = movingAverage(firstHalf, Math.max(1, firstHalf.length));
  const latestAvg = movingAverage(secondHalf, Math.max(1, secondHalf.length));
  const change = percentChange(prevAvg, latestAvg);

  const anyMock = rows.some((o) => o.isMock);
  const allMock = rows.length > 0 && rows.every((o) => o.isMock);

  return {
    commodity,
    market,
    district,
    windowDays,
    observations: rows.length,
    latestPricePerKg: rows.length > 0 ? (rows[rows.length - 1]?.pricePerKg ?? null) : null,
    previousPricePerKg: rows.length > 1 ? (rows[0]?.pricePerKg ?? null) : null,
    changePercent: change == null ? null : Math.round(change * 10) / 10,
    direction: directionOf(change),
    series,
    dataMode: rows.length === 0 ? 'demo' : allMock ? 'demo' : anyMock ? 'mixed' : 'live',
  };
}

/** Latest observation per commodity (optionally scoped). */
export function latestByCommodity(
  observations: MarketObservation[],
  scope: { market?: string; district?: string } = {},
): Map<CommodityId, MarketObservation> {
  const out = new Map<CommodityId, MarketObservation>();
  const sorted = [...observations]
    .filter((o) => (scope.market ? o.market === scope.market : true))
    .filter((o) => (scope.district ? o.district === scope.district : true))
    .sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt));
  for (const o of sorted) {
    if (!out.has(o.commodity)) out.set(o.commodity, o);
  }
  return out;
}
