/**
 * Provenance & trust types.
 *
 * Every externally-sourced record preserves WHERE it came from and WHEN.
 * Every AI output preserves WHAT went in, WHICH model/prompt, and review status.
 * Nothing here is ever silently overwritten — history is append-only.
 */

/** How content was verified / what kind of content it is. Shown as a visible badge in UI. */
export type ContentStatus =
  | 'verified' // Verified report — confirmed by a trusted/official source
  | 'developing' // Developing — event still unfolding, details may change
  | 'multi-source' // Multiple-source report — same event across 2+ sources
  | 'analysis' // Analysis — human/AI explanation of verified facts
  | 'forecast' // Forecast — probabilistic outlook, NOT a fact
  | 'opinion'; // Opinion — clearly marked viewpoint

/** Where a record's data came from. */
export interface SourceRef {
  /** Human-readable source name, e.g. "The New Times" */
  name: string;
  /** Original URL of the source document. Must be real — never invented. */
  url: string;
  /** When the source published it (ISO 8601), if known. */
  publishedAt?: string;
  /** When Ibihe fetched it (ISO 8601). */
  fetchedAt: string;
  /** Language of the original document. */
  language?: 'rw' | 'en' | 'fr' | 'sw' | string;
  /** How much weight the newsroom gives this source. */
  authority?: 'primary' | 'official' | 'wire' | 'outlet' | 'aggregator' | 'social';
  /** 0..1 editorial trust score (1 = we would publish on it alone). */
  credibility?: number;
  /** Wayback / archive copy, so the claim stays checkable if the page dies. */
  archivedUrl?: string;
  /** Page quote or paragraph the claim came from. */
  quote?: string;
  /** Who added this source to the story. */
  addedBy?: string;
}

/** Provenance for AI-generated content. */
export interface AIGeneration {
  /** IDs of the source records used as input (articles, observations, ...). */
  inputIds: string[];
  /** Model/provider identifier, e.g. "claude-sonnet-4-20250514" or "ibihe-extractive-0.1". */
  model: string;
  /** Version of the prompt/ruleset used, e.g. "summarize-rw-1.2". */
  promptVersion: string;
  /** When the output was generated (ISO 8601). */
  generatedAt: string;
  /** Human review workflow state. */
  reviewStatus: 'unreviewed' | 'reviewed' | 'flagged';
  /** True when output came from deterministic local rules (no LLM). */
  isRuleBased?: boolean;
}

/** Wrapper marking a value as AI-generated so UI can label it. */
export interface AIOutput<T> {
  value: T;
  ai: AIGeneration;
}

/** Freshness description for time-sensitive data (markets, weather). */
export interface Freshness {
  /** When the underlying event was observed (ISO 8601). */
  observedAt: string;
  /** When Ibihe fetched/recorded it (ISO 8601). */
  fetchedAt: string;
  /** Age bucket computed at read time. */
  ageBucket?: 'fresh' | 'today' | 'this-week' | 'stale';
}

/** Whether a payload contains live data or clearly-marked demo data. */
export type DataMode = 'live' | 'demo' | 'mixed';

/** Standard envelope for records that may be demo seeds in development. */
export interface DemoMarking {
  /** True => synthetic development data. UI MUST show a demo banner. */
  isMock: boolean;
}
