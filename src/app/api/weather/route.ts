import { NextRequest } from 'next/server';
import { getDistrictWeather } from '@/lib/weather/client';
import { buildAgroAdvisory } from '@/lib/weather/agro';
import { ok, err } from '@/lib/api/envelope';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const district = (searchParams.get('district') ?? 'Gasabo').slice(0, 40);
    const weather = await getDistrictWeather(district);
    const advisory = buildAgroAdvisory(weather);
    // Weather is live-only: stale cache is served but flagged unavailable.
    return ok({ weather, advisory }, 'live');
  } catch (e) {
    console.error('[api/weather]', e);
    return err('weather-failed', 'Ikirere ntikibonetse ubu.', 'Weather unavailable right now.');
  }
}
