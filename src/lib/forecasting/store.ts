/**
 * Forecast serving layer (server-only).
 *
 * - Generates fresh baseline forecasts on demand (agriculture only).
 * - Persists every generated forecast (append-only, never overwritten).
 * - Evaluates due forecasts against observed market prices.
 * - Builds the public track record.
 */
import type { DataMode } from '../../types/provenance';
import type { Forecast, TrackRecord } from '../../types/forecasting';
import type { CommodityId } from '../../types/market';
import { listForecastsRepo, saveForecastsRepo } from '../db/repos/forecasts.ts';
import { COMMODITY_IDS } from '../market/commodities.ts';
import { readRealObservations } from '../market/store.ts';
import { DEMO_OBSERVATIONS } from '../market/demo-observations.ts';
import {
  BASELINE_MODEL_VERSION,
  buildTrackRecord,
  evaluateDirection,
  generateForecast,
} from './engine.ts';

export const FORECAST_STORE = 'forecasts';

async function readStoredForecasts(): Promise<Forecast[]> {
  return listForecastsRepo();
}

async function persistForecasts(list: Forecast[]): Promise<void> {
  await saveForecastsRepo(list);
}

/**
 * Evaluate pending forecasts whose horizon has passed, using the closest
 * observation at/after resolution. Appends outcomes in place (same id —
 * corrections append a new evaluation note instead).
 */
export async function evaluateDueForecasts(now = new Date()): Promise<Forecast[]> {
  const stored = await readStoredForecasts();
  const real = await readRealObservations();
  const pool = real.length > 0 ? real : DEMO_OBSERVATIONS;
  let changed = false;

  for (const f of stored) {
    if (f.evaluation !== 'pending') continue;
    if (new Date(f.resolvesAt).getTime() > now.getTime()) continue;
    if (f.baselinePricePerKg == null) {
      f.evaluation = 'void';
      f.outcome = {
        evaluatedAt: now.toISOString(),
        groundTruthRefs: [],
        noteKiny: 'Nta giciro fatizo cyabonetse — iri hanura ntirishoboye gusuzumwa.',
        noteEn: 'No baseline price — this forecast could not be evaluated.',
      };
      changed = true;
      continue;
    }
    const candidates = pool
      .filter((o) => o.commodity === f.commodity && o.pricePerKg != null)
      .filter((o) => (f.district ? o.district === f.district : true))
      .filter((o) => (f.market ? o.market === f.market : true))
      .sort((a, b) => Math.abs(+new Date(a.observedAt) - +new Date(f.resolvesAt)) - Math.abs(+new Date(b.observedAt) - +new Date(f.resolvesAt)));
    const truth = candidates[0];
    if (!truth?.pricePerKg) {
      f.evaluation = 'void';
      f.outcome = {
        evaluatedAt: now.toISOString(),
        groundTruthRefs: [],
        noteKiny: 'Nta giciro cyabonetse ku munsi wagenwe — iri hanura ntiryasuzumwe.',
        noteEn: 'No observed price near resolution — forecast left unevaluated.',
      };
      changed = true;
      continue;
    }
    const { actual, status } = evaluateDirection(f.direction, f.baselinePricePerKg, truth.pricePerKg);
    f.evaluation = status;
    f.outcome = {
      evaluatedAt: now.toISOString(),
      observedPricePerKg: Math.round(truth.pricePerKg),
      actualDirection: actual,
      groundTruthRefs: [truth.id],
      noteKiny:
        status === 'correct'
          ? `Icyabaye gihuye n’ibyahanuwe (${truth.market}, ${truth.observedAt.slice(0, 10)}).`
          : `Icyabaye cyatandukanye n’ibyahanuwe (${truth.market}, ${truth.observedAt.slice(0, 10)}). Ibihe irabibika kugira ngo yige.`,
      noteEn:
        status === 'correct'
          ? `Outcome matched the forecast (${truth.market}, ${truth.observedAt.slice(0, 10)}).`
          : `Outcome differed from the forecast (${truth.market}, ${truth.observedAt.slice(0, 10)}). Ibihe keeps it to learn.`,
    };
    changed = true;
  }

  if (changed) await persistForecasts(stored);
  return stored;
}

export interface ForecastListResult {
  forecasts: Forecast[];
  trackRecord: TrackRecord;
  dataMode: DataMode;
  fetchedAt: string;
  modelVersion: string;
}

/**
 * Serve forecasts: evaluate due ones, then ensure one fresh forecast per
 * commodity × horizon exists for the current window.
 */
export async function listForecasts(
  filter: { commodity?: CommodityId; horizon?: Forecast['horizon'] } = {},
  now = new Date(),
): Promise<ForecastListResult> {
  const fetchedAt = now.toISOString();
  const stored = await evaluateDueForecasts(now);
  const real = await readRealObservations();
  const pool = real.length > 0 ? real : DEMO_OBSERVATIONS;

  const horizons: Forecast['horizon'][] = filter.horizon ? [filter.horizon] : ['7d', '14d', '30d'];
  const commodities: CommodityId[] = filter.commodity ? [filter.commodity] : [...COMMODITY_IDS];

  const byKey = new Map(stored.map((f) => [`${f.commodity}|${f.horizon}|${f.district ?? ''}|${f.market ?? ''}|${f.evaluation}`, f]));
  const fresh: Forecast[] = [];
  const todayKey = now.toISOString().slice(0, 10);

  for (const c of commodities) {
    for (const h of horizons) {
      const existing = stored.find(
        (f) =>
          f.commodity === c &&
          f.horizon === h &&
          !f.district &&
          !f.market &&
          f.evaluation === 'pending' &&
          f.modelVersion === BASELINE_MODEL_VERSION &&
          f.createdAt.slice(0, 10) === todayKey,
      );
      if (existing) {
        fresh.push(existing);
        continue;
      }
      const fc = generateForecast({ commodity: c, horizon: h }, pool, now, todayKey);
      if (fc) {
        // Avoid id collision with older stored rows.
        fc.id = `${fc.id}-${stored.length + fresh.length}`;
        fresh.push(fc);
        stored.push(fc);
        byKey.set(`${fc.commodity}|${fc.horizon}||`, fc);
      }
    }
  }
  await persistForecasts(stored);

  const visible = stored
    .filter((f) => (filter.commodity ? f.commodity === filter.commodity : true))
    .filter((f) => (filter.horizon ? f.horizon === filter.horizon : true))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const trackRecord = buildTrackRecord(stored);
  const anyMock = visible.some((f) => f.isMock);
  const allMock = visible.length > 0 && visible.every((f) => f.isMock);

  return {
    forecasts: visible.slice(0, 60),
    trackRecord,
    dataMode: visible.length === 0 ? 'demo' : allMock ? 'demo' : anyMock ? 'mixed' : 'live',
    fetchedAt,
    modelVersion: BASELINE_MODEL_VERSION,
  };
}
