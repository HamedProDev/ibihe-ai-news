import type { AIGeneration } from './provenance';

/** A measured weather value — never a prediction. */
export interface WeatherObservation {
  district: string;
  observedAt: string;
  tempC: number | null;
  humidityPct: number | null;
  windKph: number | null;
  precipitationMm: number | null;
  conditionCode: number | null;
  /** Where the measurement came from, e.g. "Open-Meteo (ERA5/model)". */
  source: string;
}

/** A forecasted weather value — always carries uncertainty, never certainty. */
export interface WeatherForecastDay {
  date: string;
  district: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  /** 0..100 probability of precipitation. */
  precipitationProbability: number | null;
  precipitationMm: number | null;
  conditionCode: number | null;
  /** Where the forecast came from, e.g. "Open-Meteo". */
  source: string;
}

export interface DistrictWeather {
  district: string;
  latitude: number;
  longitude: number;
  observation: WeatherObservation | null;
  forecast: WeatherForecastDay[];
  fetchedAt: string;
  /** False when the provider is unreachable — UI must show "unavailable", never fake data. */
  available: boolean;
}

/** Weather → agriculture interpretation. Explicitly labeled as AI/ruleset interpretation. */
export interface AgroAdvisory {
  district: string;
  /** Rainfall outlook in plain Kinyarwanda, with uncertainty stated. */
  rainfallOutlookKiny: string;
  rainfallOutlookEn: string;
  /** Crop implications. */
  implicationsKiny: string[];
  implicationsEn: string[];
  /** Recommended actions (advisory, not instructions). */
  recommendationsKiny: string[];
  recommendationsEn: string[];
  /** What could make this interpretation wrong. */
  uncertaintyKiny: string;
  uncertaintyEn: string;
  ai: AIGeneration;
  /** IDs/refs of weather inputs used. */
  inputRefs: string[];
}
