import { err, ok } from '@/lib/api/envelope';

/**
 * @deprecated Removed in favor of the transparent forecasting engine.
 * The old endpoint generated free-form "predictions" (including political
 * ones) with no evidence trail — incompatible with Ibihe's trust model.
 * Use GET /api/forecasts (agriculture baselines, fully disclosed).
 */
export async function POST() {
  return ok(
    { retired: true, useInstead: '/api/forecasts' },
    'live',
    { status: 410 },
  );
}

export async function GET() {
  return err('retired', 'Iyi endpoint yavuyeho. Koresha /api/forecasts.', 'This endpoint is retired. Use /api/forecasts.', 410);
}
