import { NextRequest } from 'next/server';
import { queryMarket } from '@/lib/market/store';
import { COMMODITIES, type COMMODITY_IDS } from '@/lib/market/commodities';
import { ok, err } from '@/lib/api/envelope';
import { toLegacyMarketPrices } from '@/types';

type CommodityId = (typeof COMMODITY_IDS)[number];

function isCommodity(v: string | null): v is CommodityId {
  return !!v && v in COMMODITIES;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commodityParam = searchParams.get('commodity');
    const result = await queryMarket({
      commodity: isCommodity(commodityParam) ? commodityParam : undefined,
      district: searchParams.get('district') ?? undefined,
      market: searchParams.get('market') ?? undefined,
      windowDays: Math.min(120, Math.max(7, parseInt(searchParams.get('windowDays') || '30', 10) || 30)),
      limit: Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10) || 200)),
    });

    const names = Object.fromEntries(
      Object.values(COMMODITIES).map((c) => [c.id, { kiny: c.nameKiny, en: c.nameEn }]),
    );
    const body = {
      observations: result.observations,
      trends: result.trends,
      latest: result.latest,
      districts: result.districts,
      markets: result.markets,
    };
    const res = ok(body, result.dataMode);
    const json = await res.json();
    // Legacy fields for the old MarketTicker (deprecated).
    return Response.json({
      ...json,
      prices: toLegacyMarketPrices(result.observations, names),
    });
  } catch (e) {
    console.error('[api/market]', e);
    return err('market-failed', 'Amakuru y’isoko ntabonetse.', 'Market data unavailable.');
  }
}
