/**
 * District weather client (server-only).
 *
 * Provider: Open-Meteo (free, no API key). Responses are cached 30 minutes.
 * When the provider is unreachable the client returns { available: false } —
 * the UI must show "unavailable", NEVER fabricated weather.
 */
import type { DistrictWeather, WeatherForecastDay, WeatherObservation } from '../../types/weather';
import { findDistrict } from '../geo/rwanda.ts';
import { readStore, storeAgeMs, writeStore } from '../db/json-store.ts';

const CACHE_MS = 30 * 60 * 1000;

interface OpenMeteoDaily {
  time?: string[];
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  weathercode?: Array<number | null>;
}

interface OpenMeteoCurrent {
  temperature_2m?: number | null;
  relativehumidity_2m?: number | null;
  relative_humidity_2m?: number | null;
  windspeed_10m?: number | null;
  wind_speed_10m?: number | null;
  precipitation?: number | null;
  weathercode?: number | null;
  weather_code?: number | null;
  time?: string;
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

function toForecast(district: string, daily: OpenMeteoDaily | undefined): WeatherForecastDay[] {
  if (!daily?.time) return [];
  return daily.time.slice(0, 7).map((date, i) => ({
    date,
    district,
    tempMaxC: num(daily.temperature_2m_max?.[i]),
    tempMinC: num(daily.temperature_2m_min?.[i]),
    precipitationProbability: num(daily.precipitation_probability_max?.[i]),
    precipitationMm: num(daily.precipitation_sum?.[i]),
    conditionCode: num(daily.weathercode?.[i]),
    source: 'Open-Meteo',
  }));
}

function toObservation(district: string, cur: OpenMeteoCurrent | undefined): WeatherObservation | null {
  if (!cur) return null;
  const humidity = num(cur.relative_humidity_2m ?? cur.relativehumidity_2m);
  const wind = num(cur.wind_speed_10m ?? cur.windspeed_10m);
  const temp = num(cur.temperature_2m);
  if (temp == null && humidity == null) return null;
  return {
    district,
    observedAt: typeof cur.time === 'string' ? cur.time : new Date().toISOString(),
    tempC: temp,
    humidityPct: humidity,
    windKph: wind,
    precipitationMm: num(cur.precipitation),
    conditionCode: num(cur.weather_code ?? cur.weathercode),
    source: 'Open-Meteo (model blend)',
  };
}

export type FetchFn = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

async function fetchWithTimeout(fetchFn: FetchFn, url: string, ms: number): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetchFn(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`provider-http`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getDistrictWeather(
  districtName: string,
  fetchFn?: FetchFn,
): Promise<DistrictWeather> {
  const district = findDistrict(districtName) ?? findDistrict('Gasabo');
  const name = district?.name ?? 'Gasabo';
  const lat = district?.latitude ?? -1.92;
  const lon = district?.longitude ?? 30.1;
  const fetchedAt = new Date().toISOString();

  const cacheKey = `weather-${name.toLowerCase()}`;
  const cached = await readStore<DistrictWeather>(cacheKey);
  if (cached && storeAgeMs(cached) < CACHE_MS && cached.value.available) {
    return cached.value;
  }

  const unavailable: DistrictWeather = {
    district: name,
    latitude: lat,
    longitude: lon,
    observation: null,
    forecast: cached?.value.forecast ?? [],
    fetchedAt,
    available: false,
  };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode` +
      `&timezone=Africa%2FKigali&forecast_days=7`;
    const raw = (await fetchWithTimeout(fetchFn ?? (fetch as unknown as FetchFn), url, 8000)) as OpenMeteoResponse;
    const result: DistrictWeather = {
      district: name,
      latitude: lat,
      longitude: lon,
      observation: toObservation(name, raw.current),
      forecast: toForecast(name, raw.daily),
      fetchedAt,
      available: true,
    };
    if (result.forecast.length === 0 && !result.observation) return unavailable;
    await writeStore(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`[weather] provider failed for ${name}:`, err instanceof Error ? err.message : err);
    // Serve stale cache (marked by its own fetchedAt) but flag unavailable.
    if (cached && cached.value.forecast.length > 0) {
      return { ...cached.value, available: false, fetchedAt };
    }
    return unavailable;
  }
}
