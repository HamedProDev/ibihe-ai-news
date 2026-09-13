import type { AIGeneration } from './provenance';

export type AskIntent = 'news' | 'market' | 'weather' | 'forecast' | 'general';

export interface AskCitation {
  /** Stable reference id, e.g. article id, observation id, forecast id. */
  refId: string;
  kind: 'article' | 'market' | 'weather' | 'forecast';
  labelKiny: string;
  labelEn: string;
  url?: string;
  publishedAt?: string;
}

export interface AskAnswer {
  /** Kinyarwanda answer text (markdown-lite). */
  answerKiny: string;
  answerEn: string;
  intent: AskIntent;
  citations: AskCitation[];
  /** True when evidence was insufficient — answer says so honestly. */
  evidenceInsufficient: boolean;
  ai: AIGeneration;
}

export interface AskQuery {
  question: string;
  locale: 'rw' | 'en';
}
