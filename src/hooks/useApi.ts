'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchJson } from '@/lib/client/api';
import type { DataMode } from '@/types/provenance';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  dataMode: DataMode;
  retry: () => void;
}

/**
 * Generic data hook with loading / error / retry semantics.
 * Every data-driven feature uses this so states stay consistent.
 */
export function useApi<T>(path: string | null, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('live');
  const [attempt, setAttempt] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!path) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-state reset when path clears
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchJson<T>(path)
      .then((r) => {
        if (cancelled || !alive.current) return;
        setData(r.data);
        setDataMode(r.dataMode);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled || !alive.current) return;
        setError(e instanceof ApiError ? e : new ApiError('network', 'Ntibashoboye guhuza na seriveri.', 'Could not reach the server.'));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, attempt, ...deps]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { data, loading, error, dataMode, retry };
}
