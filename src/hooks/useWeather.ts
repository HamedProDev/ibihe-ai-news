'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { AgroAdvisory, DistrictWeather } from '@/types/weather';

interface WeatherData {
  weather: DistrictWeather;
  advisory: AgroAdvisory | null;
}

export function useWeather(district: string) {
  const path = useMemo(() => `/api/weather?district=${encodeURIComponent(district)}`, [district]);
  const { data, loading, error, retry } = useApi<WeatherData>(path, [path]);
  return {
    weather: data?.weather ?? null,
    advisory: data?.advisory ?? null,
    loading,
    error,
    retry,
  };
}
