/**
 * Market observation serving layer (server-only).
 *
 * Real observations (append-only store) + deterministic demo series.
 * Queries declare their dataMode: 'live' | 'demo' | 'mixed'.
 * Historical rows are NEVER overwritten — corrections append new rows.
 */
import type { DataMode } from '../../types/provenance';
import type { CommodityId, MarketFilters, MarketObservation, MarketTrend } from '../../types/market';
import { readStore, writeStore } from '../db/json-store.ts';
import { DEMO_OBSERVATIONS } from './demo-observations.ts';
import { buildTrend, latestByCommodity } from './stats.ts';

export const MARKET_STORE = 'market-observations';

export async function readRealObservations(): Promise<MarketObservation[]> {
  return (await readStore<MarketObservation[]>(MARKET_STORE))?.value ?? [];
}

/** Append real observations (validated by caller). History is append-only. */
export async function appendObservations(rows: MarketObservation[]): Promise<number> {
  const existing = await readRealObservations();
  const ids = new Set(existing.map((o) => o.id));
  const fresh = rows.filter((o) => !o.isMock && !ids.has(o.id));
  if (fresh.length === 0) return existing.length;
  await writeStore(MARKET_STORE, [...existing, ...fresh].slice(-5000));
  return existing.length + fresh.length;
}

export interface MarketQuery extends MarketFilters {
  limit?: number;
  includeDemo?: boolean;
}

export interface MarketQueryResult {
  observations: MarketObservation[];
  trends: MarketTrend[];
  latest: Array<{ commodity: CommodityId; observation: MarketObservation | null }>;
  districts: string[];
  markets: string[];
  dataMode: DataMode;
  fetchedAt: string;
}

export async function queryMarket(q: MarketQuery = {}): Promise<MarketQueryResult> {
  const fetchedAt = new Date().toISOString();
  const real = await readRealObservations();
  const includeDemo = q.includeDemo ?? true;
  const all = includeDemo ? [...real, ...DEMO_OBSERVATIONS] : real;

  const { commodity, district, market, windowDays = 30, limit = 200 } = q;
  const cutoff = Date.now() - windowDays * 24 * 3600_000;
  const filtered = all
    .filter((o) => (commodity ? o.commodity === commodity : true))
    .filter((o) => (district ? o.district === district : true))
    .filter((o) => (market ? o.market === market : true))
    .filter((o) => new Date(o.observedAt).getTime() >= cutoff)
    .sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt));

  const inScope = all
    .filter((o) => (district ? o.district === district : true))
    .filter((o) => (market ? o.market === market : true));

  const commodities: CommodityId[] = commodity
    ? [commodity]
    : [...new Set(inScope.map((o) => o.commodity))];
  const trends = commodities.map((c) => buildTrend(c, inScope, { windowDays, market, district }));

  const latest = latestByCommodity(inScope);
  const districts = [...new Set(all.map((o) => o.district))].sort();
  const markets = [...new Set(all.map((o) => o.market))].sort();

  const shown = includeDemo ? filtered : filtered.filter((o) => !o.isMock);
  const anyMock = shown.some((o) => o.isMock);
  const allMock = shown.length > 0 && shown.every((o) => o.isMock);
  const dataMode: DataMode = shown.length === 0 ? 'demo' : allMock ? 'demo' : anyMock ? 'mixed' : 'live';

  return {
    observations: shown.slice(0, limit),
    trends,
    latest: commodities.map((c) => ({ commodity: c, observation: latest.get(c) ?? null })),
    districts,
    markets,
    dataMode,
    fetchedAt,
  };
}
