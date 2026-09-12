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
    // Official feed (verified live): News section. Other sections use the
    // same pattern — /rssFeed/15 opinions, /16 sports, /17 lifestyle, ...
    // Full list: https://www.newtimes.co.rw/rss
    feedUrl: 'https://www.newtimes.co.rw/rssFeed/14',
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
    // No feedUrl: Igihe publishes no public RSS (checked 2026-09-12:
    // /rss.xml, /feed, /backend, spip.php?page=backend — all 404, including
    // on en.igihe.com). Source stays registered for attribution/linking;
    // add a feedUrl only when Igihe exposes a verified machine-readable
    // feed. No blind scraping per project policy.
    language: 'rw',
    defaultCategory: 'amahanga',
    trustTier: 2,
    excerptPolicy: 'link-only',
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
