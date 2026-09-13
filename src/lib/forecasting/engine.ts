/**
 * Transparent forecasting engine — AGRICULTURE ONLY (no political forecasts).
 *
 * Baseline ruleset `ibihe-baseline-0.1` (documented, versioned, reproducible):
 *   signal = w1 * momentum + w2 * seasonal + w3 * rainfall
 *   probability(direction) = logistic(signal), capped to [55, 85]
 *
 * - momentum: short-MA vs long-MA of normalized prices (measured).
 * - seasonal: documented harvest-calendar heuristic (NOT measured data —
 *   disclosed in assumptions).
 * - rainfall: optional 0..1 wetness outlook mapped to a mild effect.
 *
 * Confidence reflects DATA quantity/recency, not certainty about the future.
 * Every output carries evidence, assumptions and invalidators.
 */
import type {
  EvaluationStatus,
  Forecast,
  ForecastDirection,
  ForecastHorizon,
  TrackRecord,
} from '../../types/forecasting';
import type { CommodityId, MarketObservation } from '../../types/market';
import { COMMODITIES } from '../market/commodities.ts';

export const BASELINE_MODEL_VERSION = 'ibihe-baseline-0.1';
export const PROB_FLOOR = 55;
export const PROB_CAP = 85;

const W1_MOMENTUM = 1.0;
const W2_SEASONAL = 0.6;
const W3_RAINFALL = 0.4;

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface EngineSignals {
  momentum: number; // -1..1 (positive = rising)
  seasonal: number; // -1..1 (positive = scarcity pressure)
  rainfall: number; // -1..1 (positive = wet outlook)
  momentumN: number;
  baselinePricePerKg: number | null;
}

/** Compute transparent input signals from observations. Pure. */
export function computeSignals(
  observations: MarketObservation[],
  commodity: CommodityId,
  now = new Date(),
  rainWetness01?: number,
): EngineSignals {
  const rows = observations
    .filter((o) => o.commodity === commodity && o.pricePerKg != null)
    .sort((a, b) => +new Date(a.observedAt) - +new Date(b.observedAt));
  const prices = rows.map((o) => o.pricePerKg as number);
  const shortN = Math.min(7, prices.length);
  const longN = Math.min(28, prices.length);
  const shortAvg = avg(prices.slice(-shortN));
  const longAvg = avg(prices.slice(-longN));
  let momentum = 0;
  if (shortAvg != null && longAvg != null && longAvg > 0) {
    momentum = Math.max(-1, Math.min(1, (shortAvg - longAvg) / longAvg / 0.15));
  }

  // Seasonal heuristic: harvest months push DOWN, off-season pushes UP.
  const month = now.getMonth() + 1;
  const harvest = COMMODITIES[commodity]?.harvestMonths ?? [];
  const seasonal = harvest.includes(month) ? -0.5 : harvest.includes(((month % 12) + 1)) ? -0.2 : 0.35;

  const rainfall = rainWetness01 == null ? 0 : Math.max(-1, Math.min(1, (rainWetness01 - 0.5) * 2 * 0.5));

  return {
    momentum,
    seasonal,
    rainfall,
    momentumN: prices.length,
    baselinePricePerKg: prices.length > 0 ? (prices[prices.length - 1] ?? null) : null,
  };
}

export interface ForecastRequest {
  commodity: CommodityId;
  horizon: ForecastHorizon;
  district?: string;
  market?: string;
  rainWetness01?: number;
}

const HORIZON_DAYS: Record<ForecastHorizon, number> = { '7d': 7, '14d': 14, '30d': 30 };

const COMMODITY_KINY: Record<CommodityId, string> = {
  ibirayi: 'Ibirayi',
  ibishyimbo: 'Ibishyimbo',
  ibigori: 'Ibigori',
  inyanya: 'Inyanya',
  igitoki: 'Ibitoki',
  umuceri: 'Umuceri',
  imyumbati: 'Imyumbati',
};

/** Generate a forecast from signals. Pure/deterministic given inputs. */
export function generateForecast(
  req: ForecastRequest,
  observations: MarketObservation[],
  now = new Date(),
  idSuffix = 'live',
): Forecast | null {
  const scope = req.district ?? req.market;
  const scoped = observations.filter(
    (o) => (req.district ? o.district === req.district : true) && (req.market ? o.market === req.market : true),
  );
  const pool = scoped.length >= 5 ? scoped : observations;
  const signals = computeSignals(pool, req.commodity, now, req.rainWetness01);
  if (signals.baselinePricePerKg == null || signals.momentumN < 5) return null; // not enough data: refuse.

  const raw = W1_MOMENTUM * signals.momentum + W2_SEASONAL * signals.seasonal + W3_RAINFALL * signals.rainfall;
  const direction: ForecastDirection = raw > 0.08 ? 'up' : raw < -0.08 ? 'down' : 'flat';
  const p = logistic(Math.abs(raw) * 3.2) * 100; // 50..~100
  const probability = Math.round(Math.max(PROB_FLOOR, Math.min(PROB_CAP, direction === 'flat' ? Math.max(50, 100 - p + 50) : p)));

  // Confidence from data quantity + recency.
  const sorted = [...pool]
    .filter((o) => o.commodity === req.commodity)
    .sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt));
  const newestAgeDays = sorted.length > 0 ? (now.getTime() - new Date(sorted[0]?.observedAt ?? 0).getTime()) / 86400_000 : 999;
  const quantityScore = Math.min(1, signals.momentumN / 40);
  const recencyScore = newestAgeDays <= 3 ? 1 : newestAgeDays <= 10 ? 0.7 : newestAgeDays <= 30 ? 0.4 : 0.2;
  const confidence = Math.round(45 + 40 * (0.5 * quantityScore + 0.5 * recencyScore));

  const horizonDays = HORIZON_DAYS[req.horizon];
  const resolvesAt = new Date(now.getTime() + horizonDays * 86400_000).toISOString();
  const base = signals.baselinePricePerKg;
  const spread = Math.max(0.03, 0.02 + horizonDays * 0.004); // wider range for longer horizons
  const centerShift = direction === 'up' ? spread / 2 : direction === 'down' ? -spread / 2 : 0;
  const predictedRangePerKg = {
    low: Math.round(base * (1 + centerShift - spread / 2)),
    high: Math.round(base * (1 + centerShift + spread / 2)),
  };

  const nameK = COMMODITY_KINY[req.commodity];
  const horizonK = req.horizon === '7d' ? 'iminsi 7' : req.horizon === '14d' ? 'iminsi 14' : 'iminsi 30';
  const horizonE = req.horizon === '7d' ? '7 days' : req.horizon === '14d' ? '14 days' : '30 days';

  const evidenceKiny = [
    `Umurongo w’ibiciro uheruka: ${signals.momentum >= 0 ? 'ibiciro biri kuzamuka' : 'ibiciro biri kumanuka'} ugereranyije n’ukwezi gushize.`,
    signals.seasonal < 0
      ? 'Turi mu gihe cyegereye isarura — amasoko asanzwe yuzura, ibiciro bikamanuka.'
      : 'Ntiturimo igihe cy’isarura — ibicuruzwa bishobora kuba bike, ibiciro bikazamuka.',
  ];
  const evidenceEn = [
    `Recent price momentum: prices are ${signals.momentum >= 0 ? 'rising' : 'falling'} vs last month.`,
    signals.seasonal < 0
      ? 'Near harvest season — markets usually fill up and prices soften.'
      : 'Outside harvest season — supply may be tight and prices firm.',
  ];
  if (req.rainWetness01 != null) {
    evidenceKiny.push(`Iteganyagihe ry’imvura ryafashweho: ubushuhe ${Math.round(req.rainWetness01 * 100)}%.`);
    evidenceEn.push(`Rainfall outlook factored in: wetness ${Math.round(req.rainWetness01 * 100)}%.`);
  }

  return {
    id: `fc-${req.commodity}-${req.horizon}-${idSuffix}`,
    questionKiny: `${nameK} — Ese igiciro kizajya he mu ${horizonK} iri imbere${scope ? ` (${scope})` : ''}?`,
    questionEn: `${COMMODITIES[req.commodity]?.nameEn ?? req.commodity} — Where is the price headed over the next ${horizonE}${scope ? ` (${scope})` : ''}?`,
    commodity: req.commodity,
    district: req.district,
    market: req.market,
    horizon: req.horizon,
    resolvesAt,
    direction,
    probability,
    confidence,
    predictedRangePerKg,
    baselinePricePerKg: Math.round(base),
    evidenceKiny,
    evidenceEn,
    assumptionsKiny: [
      'Nta gihunga gikomeye cy’isoko (nta bibazo by’imihanda, nta mabwiriza mashya ya leta).',
      'Igisekuru cy’isarura cyakoreshejwe ni ugereranya rusange — si imibare yapimwe.',
      `Amakuru y’ibiciro (${signals.momentumN} yapimwe) arafatwa nk’ukuri.`,
    ],
    assumptionsEn: [
      'No major market shock (no road closures, no sudden policy changes).',
      'The harvest calendar used is a general heuristic — not measured data.',
      `Price inputs (${signals.momentumN} observations) are taken at face value.`,
    ],
    invalidatorsKiny: [
      'Imvura nyinshi cyane yangiza imyaka cyangwa imihanda.',
      'Icyemezo cya leta gihindura ibisabwa cyangwa ibiciro (urugero: kohereza hanze).',
      'Ikibazo gikomeye cy’ubwikorezi gituma ibicuruzwa bitagera ku isoko.',
    ],
    invalidatorsEn: [
      'Extreme rainfall destroying crops or roads.',
      'A policy decision shifting demand or prices (e.g. exports).',
      'A major transport disruption keeping supply from markets.',
    ],
    modelVersion: BASELINE_MODEL_VERSION,
    createdAt: now.toISOString(),
    evaluation: 'pending',
    isMock: pool.every((o) => o.isMock),
  };
}

/** Evaluate a forecast against the observed direction. Pure. */
export function evaluateDirection(
  predicted: ForecastDirection,
  baselinePricePerKg: number,
  observedPricePerKg: number,
  flatBandPct = 2,
): { actual: ForecastDirection; status: EvaluationStatus } {
  const change = ((observedPricePerKg - baselinePricePerKg) / baselinePricePerKg) * 100;
  const actual: ForecastDirection = Math.abs(change) < flatBandPct ? 'flat' : change > 0 ? 'up' : 'down';
  return { actual, status: actual === predicted ? 'correct' : 'incorrect' };
}

/** Build the track record from evaluated forecasts. Pure. */
export function buildTrackRecord(forecasts: Forecast[]): TrackRecord {
  const evaluated = forecasts.filter((f) => f.evaluation === 'correct' || f.evaluation === 'incorrect');
  const correct = evaluated.filter((f) => f.evaluation === 'correct').length;

  const group = <K extends string>(key: (f: Forecast) => K): Array<{ key: K; evaluated: number; accuracy: number | null }> => {
    const map = new Map<K, { e: number; c: number }>();
    for (const f of evaluated) {
      const k = key(f);
      const cur = map.get(k) ?? { e: 0, c: 0 };
      cur.e++;
      if (f.evaluation === 'correct') cur.c++;
      map.set(k, cur);
    }
    return [...map.entries()].map(([k, v]) => ({
      key: k,
      evaluated: v.e,
      accuracy: v.e > 0 ? Math.round((v.c / v.e) * 1000) / 10 : null,
    }));
  };

  // Calibration: bin by predicted probability, compare with hit rate.
  const bins: Array<{ bin: string; lo: number; hi: number }> = [
    { bin: '50–60%', lo: 50, hi: 60 },
    { bin: '60–70%', lo: 60, hi: 70 },
    { bin: '70–80%', lo: 70, hi: 80 },
    { bin: '80–90%', lo: 80, hi: 90 },
  ];
  const calibration = bins.map((b) => {
    const inBin = evaluated.filter((f) => f.probability >= b.lo && f.probability < b.hi);
    const hits = inBin.filter((f) => f.evaluation === 'correct').length;
    return {
      bin: b.bin,
      predicted: (b.lo + b.hi) / 2,
      observed: inBin.length > 0 ? Math.round((hits / inBin.length) * 1000) / 10 : null,
      count: inBin.length,
    };
  });

  const anyMock = forecasts.some((f) => f.isMock);
  const allMock = forecasts.length > 0 && forecasts.every((f) => f.isMock);

  return {
    totalForecasts: forecasts.length,
    evaluated: evaluated.length,
    pending: forecasts.length - evaluated.length,
    accuracy: evaluated.length > 0 ? Math.round((correct / evaluated.length) * 1000) / 10 : null,
    byCommodity: group((f) => f.commodity).map((g) => ({ commodity: g.key, evaluated: g.evaluated, accuracy: g.accuracy })),
    byHorizon: group((f) => f.horizon).map((g) => ({ horizon: g.key, evaluated: g.evaluated, accuracy: g.accuracy })),
    byModelVersion: group((f) => f.modelVersion).map((g) => ({ modelVersion: g.key, evaluated: g.evaluated, accuracy: g.accuracy })),
    calibration,
    dataMode: forecasts.length === 0 ? 'demo' : allMock ? 'demo' : anyMock ? 'mixed' : 'live',
  };
}
