import { NextRequest } from 'next/server';
import { listForecasts } from '@/lib/forecasting/store';
import { COMMODITIES, type COMMODITY_IDS } from '@/lib/market/commodities';
import type { ForecastHorizon } from '@/types/forecasting';
import { ok, err } from '@/lib/api/envelope';

type CommodityId = (typeof COMMODITY_IDS)[number];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const c = searchParams.get('commodity');
    const h = searchParams.get('horizon');
    const result = await listForecasts({
      commodity: c && c in COMMODITIES ? (c as CommodityId) : undefined,
      horizon: h === '7d' || h === '14d' || h === '30d' ? (h as ForecastHorizon) : undefined,
    });
    return ok(
      { forecasts: result.forecasts, trackRecord: result.trackRecord, modelVersion: result.modelVersion },
      result.dataMode,
    );
  } catch (e) {
    console.error('[api/forecasts]', e);
    return err('forecasts-failed', 'Ibimenyetso ntibibonetse.', 'Forecasts unavailable.');
  }
}
