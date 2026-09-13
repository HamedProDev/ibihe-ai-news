import { NextRequest } from 'next/server';
import { listForecasts } from '@/lib/forecasting/store';
import { toLegacyPrediction } from '@/types';

/**
 * @deprecated Legacy endpoint kept for old clients. Backed by the new
 * transparent forecasting engine (agriculture only). New code should use
 * /api/forecasts which exposes probability/confidence/evidence properly.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  void searchParams;
  try {
    const result = await listForecasts({ horizon: '14d' });
    return Response.json({
      predictions: result.forecasts.slice(0, 10).map(toLegacyPrediction),
      dataMode: result.dataMode,
      deprecated: true,
      useInstead: '/api/forecasts',
    });
  } catch {
    return Response.json({ predictions: [], dataMode: 'demo', deprecated: true }, { status: 200 });
  }
}
