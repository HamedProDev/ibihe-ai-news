import type { DemoMarking, Freshness, SourceRef } from './provenance';

/** Canonical commodity identifiers (Kinyarwanda-first). */
export type CommodityId =
  | 'ibirayi'
  | 'ibishyimbo'
  | 'ibigori'
  | 'inyanya'
  | 'igitoki'
  | 'umuceri'
  | 'imyumbati';

export interface CommodityInfo {
  id: CommodityId;
  /** Kinyarwanda name, e.g. "Ibirayi". */
  nameKiny: string;
  nameEn: string;
  /** Aliases for search/entity matching (plural/singular, alternate spellings). */
  aliases: string[];
  /** Default normalized unit. */
  normalizedUnit: 'RWF/kg';
  /** Known local units and their kg conversion factor (approximate, documented). */
  localUnits: LocalUnit[];
  /** Typical harvest-season months (1-12) used ONLY as a documented baseline heuristic. */
  harvestMonths: number[];
}

export interface LocalUnit {
  /** e.g. "kg", "umufuka", "ikiro", "agatebo". */
  unit: string;
  unitKiny: string;
  /** Approximate kg per unit. Must be documented, never silently assumed elsewhere. */
  kgPerUnit: number;
}

/**
 * A single observed market price. Never fabricated: real rows come from
 * real sources; anything else MUST carry isMock=true and be labeled in UI.
 */
export interface MarketObservation extends DemoMarking, Freshness {
  id: string;
  commodity: CommodityId;
  /** Price in RWF in the ORIGINAL unit. */
  price: number;
  currency: 'RWF';
  /** Original local unit, e.g. "kg", "umufuka 100kg". */
  unit: string;
  /** Normalized price in RWF/kg for comparison (null if conversion unknown). */
  pricePerKg: number | null;
  market: string;
  district: string;
  source: SourceRef;
}

/** Aggregated trend for a commodity over a window. */
export interface MarketTrend {
  commodity: CommodityId;
  market?: string;
  district?: string;
  windowDays: number;
  observations: number;
  latestPricePerKg: number | null;
  previousPricePerKg: number | null;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat' | 'unknown';
  /** Simple moving average series for charts: [observedAt, pricePerKg]. */
  series: Array<{ at: string; pricePerKg: number }>;
  dataMode: 'live' | 'demo' | 'mixed';
}

export interface MarketFilters {
  commodity?: CommodityId;
  district?: string;
  market?: string;
  windowDays?: number;
}
