'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Forecast, ForecastHorizon, TrackRecord } from '@/types/forecasting';
import type { CommodityId } from '@/types/market';

interface ForecastData {
  forecasts: Forecast[];
  trackRecord: TrackRecord;
  modelVersion: string;
}

export function useForecasts(filter: { commodity?: CommodityId; horizon?: ForecastHorizon } = {}) {
  const path = useMemo(() => {
    const p = new URLSearchParams();
    if (filter.commodity) p.set('commodity', filter.commodity);
    if (filter.horizon) p.set('horizon', filter.horizon);
    const qs = p.toString();
    return qs ? `/api/forecasts?${qs}` : '/api/forecasts';
  }, [filter.commodity, filter.horizon]);

  const { data, loading, error, dataMode, retry } = useApi<ForecastData>(path, [path]);
  return {
    forecasts: data?.forecasts ?? [],
    trackRecord: data?.trackRecord ?? null,
    modelVersion: data?.modelVersion ?? '',
    loading,
    error,
    dataMode,
    retry,
  };
}
