import type { CommodityId } from './market';
import type { DemoMarking } from './provenance';

export type ForecastDirection = 'up' | 'down' | 'flat';
export type ForecastHorizon = '7d' | '14d' | '30d';
export type EvaluationStatus = 'pending' | 'correct' | 'incorrect' | 'void';

/**
 * A transparent forecast. Agriculture + weather ONLY for now —
 * no political predictions. A forecast is a probability, never a fact.
 */
export interface Forecast extends DemoMarking {
  id: string;
  /** The precise question being answered. */
  questionKiny: string;
  questionEn: string;
  commodity: CommodityId;
  district?: string;
  market?: string;
  horizon: ForecastHorizon;
  /** Target date the forecast resolves (ISO 8601). */
  resolvesAt: string;
  direction: ForecastDirection;
  /** Probability (0..100) that `direction` occurs. */
  probability: number;
  /** Model confidence in its own estimate (0..100), distinct from probability. */
  confidence: number;
  /** Predicted normalized price range in RWF/kg, if applicable. */
  predictedRangePerKg?: { low: number; high: number };
  /** Baseline price used (RWF/kg). */
  baselinePricePerKg?: number | null;
  evidenceKiny: string[];
  evidenceEn: string[];
  assumptionsKiny: string[];
  assumptionsEn: string[];
  /** Factors that would invalidate this forecast. */
  invalidatorsKiny: string[];
  invalidatorsEn: string[];
  /** Versioned ruleset/model, e.g. "ibihe-baseline-0.1". */
  modelVersion: string;
  createdAt: string;
  evaluation: EvaluationStatus;
  /** Filled when evaluated. */
  outcome?: ForecastOutcome;
}

export interface ForecastOutcome {
  evaluatedAt: string;
  /** Observed normalized price at resolution (RWF/kg), if applicable. */
  observedPricePerKg?: number | null;
  actualDirection?: ForecastDirection;
  /** Reference to the observation(s) used as ground truth. */
  groundTruthRefs: string[];
  noteKiny?: string;
  noteEn?: string;
}

/** Aggregate performance — never a single "AI accuracy" marketing number. */
export interface TrackRecord {
  totalForecasts: number;
  evaluated: number;
  pending: number;
  accuracy: number | null;
  byCommodity: Array<{ commodity: CommodityId; evaluated: number; accuracy: number | null }>;
  byHorizon: Array<{ horizon: ForecastHorizon; evaluated: number; accuracy: number | null }>;
  byModelVersion: Array<{ modelVersion: string; evaluated: number; accuracy: number | null }>;
  /** Calibration bins: predicted probability vs observed frequency. */
  calibration: Array<{ bin: string; predicted: number; observed: number | null; count: number }>;
  dataMode: 'live' | 'demo' | 'mixed';
}
