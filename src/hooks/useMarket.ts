'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { MarketObservation, MarketTrend, CommodityId } from '@/types/market';
import type { MarketPrice } from '@/types';
import { toLegacyMarketPrices } from '@/types';
import { COMMODITIES } from '@/lib/market/commodities';

export interface MarketData {
  observations: MarketObservation[];
  trends: MarketTrend[];
  latest: Array<{ commodity: CommodityId; observation: MarketObservation | null }>;
  districts: string[];
  markets: string[];
}

export interface MarketQuery {
  commodity?: CommodityId;
  district?: string;
  market?: string;
  windowDays?: number;
}

export function useMarketData(query: MarketQuery = {}) {
  const path = useMemo(() => {
    const p = new URLSearchParams();
    if (query.commodity) p.set('commodity', query.commodity);
    if (query.district) p.set('district', query.district);
    if (query.market) p.set('market', query.market);
    if (query.windowDays) p.set('windowDays', String(query.windowDays));
    const qs = p.toString();
    return qs ? `/api/market?${qs}` : '/api/market';
  }, [query.commodity, query.district, query.market, query.windowDays]);

  const { data, loading, error, dataMode, retry } = useApi<MarketData>(path, [path]);
  return {
    observations: data?.observations ?? [],
    trends: data?.trends ?? [],
    latest: data?.latest ?? [],
    districts: data?.districts ?? [],
    markets: data?.markets ?? [],
    loading,
    error,
    dataMode,
    retry,
  };
}

/** @deprecated Backwards-compatible hook for the old sidebar widgets. */
export function useMarket() {
  const { observations, loading, error, retry } = useMarketData();
  const prices: MarketPrice[] = useMemo(() => {
    const names = Object.fromEntries(
      Object.values(COMMODITIES).map((c) => [c.id, { kiny: c.nameKiny, en: c.nameEn }]),
    );
    return toLegacyMarketPrices(observations, names);
  }, [observations]);
  return { prices, weather: null, loading, error, retry };
}
