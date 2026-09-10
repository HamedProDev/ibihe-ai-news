import type { NewsCategory } from '../../types/news';

/**
 * Registry of permitted news sources. Ibihe only ingests from sources listed
 * here. Adding a source requires a human decision — crawlers must not invent
 * sources.
 */
export interface SourceDef {
  /** Stable id, e.g. "newtimes". */
  id: string;
  name: string;
  /** Homepage (human reference). */
  homeUrl: string;
  /** RSS/Atom feed URL, if the source offers one. */
  feedUrl?: string;
  language: 'rw' | 'en' | 'fr';
  defaultCategory: NewsCategory;
  /** 1 (official) → 3 (aggregator). Used for verification badges. */
  trustTier: 1 | 2 | 3;
  /** Whether the source allows excerpt reuse with attribution. */
  excerptPolicy: 'quote-with-link' | 'link-only';
  enabled: boolean;
}

export const SOURCE_REGISTRY: SourceDef[] = [
  {
    id: 'newtimes',
    name: 'The New Times',
    homeUrl: 'https://www.newtimes.co.rw/',
    feedUrl: 'https://www.newtimes.co.rw/rss.xml',
    language: 'en',
    defaultCategory: 'amahanga',
    trustTier: 2,
    excerptPolicy: 'quote-with-link',
    enabled: true,
  },
  {
    id: 'igihe',
    name: 'Igihe',
    homeUrl: 'https://igihe.com/',
    feedUrl: 'https://igihe.com/rss.xml',
    language: 'rw',
    defaultCategory: 'amahanga',
    trustTier: 2,
    excerptPolicy: 'quote-with-link',
    enabled: true,
  },
  {
    id: 'ktpress',
    name: 'KT Press',
    homeUrl: 'https://www.ktpress.rw/',
    feedUrl: 'https://www.ktpress.rw/feed/',
    language: 'en',
    defaultCategory: 'amahanga',
    trustTier: 2,
    excerptPolicy: 'quote-with-link',
    enabled: true,
  },
  {
    id: 'rba',
    name: 'RBA — Rwanda Broadcasting Agency',
    homeUrl: 'https://rba.co.rw/',
    language: 'rw',
    defaultCategory: 'amahanga',
    trustTier: 1,
    excerptPolicy: 'link-only',
    enabled: true,
  },
  {
    id: 'rab',
    name: 'RAB — Rwanda Agriculture Board',
    homeUrl: 'https://rab.gov.rw/',
    language: 'en',
    defaultCategory: 'ubuhinzi',
    trustTier: 1,
    excerptPolicy: 'link-only',
    enabled: true,
  },
  {
    id: 'bnr',
    name: 'BNR — National Bank of Rwanda',
    homeUrl: 'https://www.bnr.rw/',
    language: 'en',
    defaultCategory: 'ubukungu',
    trustTier: 1,
    excerptPolicy: 'link-only',
    enabled: true,
  },
  {
    id: 'minagri',
    name: 'MINAGRI',
    homeUrl: 'https://www.minagri.gov.rw/',
    language: 'en',
    defaultCategory: 'ubuhinzi',
    trustTier: 1,
    excerptPolicy: 'link-only',
    enabled: true,
  },
  {
    id: 'meteorwanda',
    name: 'Rwanda Meteorology Agency',
    homeUrl: 'https://www.meteorwanda.gov.rw/',
    language: 'en',
    defaultCategory: 'ubuhinzi',
    trustTier: 1,
    excerptPolicy: 'link-only',
    enabled: true,
  },
];

export function enabledFeedSources(): SourceDef[] {
  return SOURCE_REGISTRY.filter((s) => s.enabled && s.feedUrl);
}

export function findSource(idOrName: string): SourceDef | undefined {
  const q = idOrName.trim().toLowerCase();
  return SOURCE_REGISTRY.find((s) => s.id === q || s.name.toLowerCase() === q);
}
