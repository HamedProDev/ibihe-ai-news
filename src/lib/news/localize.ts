/**
 * Pick the right language of a story for the current UI locale.
 *
 * Feed rows only carry the rw/en pair (title/titleKiny); console stories can
 * carry a full localization for fr/sw/ar/ha. Missing pieces fall back to
 * English, then Kinyarwanda — a reader never sees an empty slot.
 */
import type { Article } from '@/types/news';
import type { Locale } from '@/lib/i18n/dictionaries';

export interface StoryStrings {
  title: string;
  excerpt: string;
  body?: string;
  keyPoints: string[];
  /** True when the body was found for the reader's language. */
  bodyLocalized: boolean;
  /** Languages the story really exists in (for the reader's toggle). */
  available: Locale[];
}

export function storyStrings(a: Article, locale: Locale): StoryStrings {
  const loc = a.localizations?.[locale];
  const rwTitle = a.titleKiny || a.title;
  const rwExcerpt = a.excerptKiny || a.excerpt;
  const isRw = locale === 'rw';
  const title = loc?.title || (isRw ? rwTitle : a.title) || rwTitle;
  const excerpt = loc?.excerpt || (isRw ? rwExcerpt : a.excerpt) || rwExcerpt;

  const langMatches = a.language === locale;
  let body: string | undefined;
  let bodyLocalized = false;
  if (loc?.body) {
    body = loc.body;
    bodyLocalized = true;
  } else if (langMatches || (!a.localizations && a.language === 'rw' && isRw)) {
    body = a.body;
    bodyLocalized = Boolean(a.body);
  } else if (isRw && (a.language === 'rw' || !a.language)) {
    body = a.body;
    bodyLocalized = Boolean(a.body);
  } else if (locale === 'en' && a.language === 'en') {
    body = a.body;
    bodyLocalized = Boolean(a.body);
  }
  if (!body && a.body) body = a.body; // last resort: show what exists

  const keyPoints = isRw
    ? a.keyPointsKiny.length
      ? a.keyPointsKiny
      : a.keyPointsEn
    : a.keyPointsEn.length
      ? a.keyPointsEn
      : a.keyPointsKiny;

  const available: Locale[] = ['rw', 'en'];
  for (const code of ['fr', 'sw'] as const) {
    if (a.localizations?.[code]?.title || a.localizations?.[code]?.body) available.push(code);
  }

  return { title, excerpt, body, keyPoints, bodyLocalized, available };
}

/** Caption/label pair that follows the same rw-first convention. */
export function pickCaption(
  entity: { caption?: string; captionKiny?: string } | undefined,
  locale: Locale,
): string {
  if (!entity) return '';
  const rw = entity.captionKiny;
  const en = entity.caption;
  if (locale === 'rw') return rw || en || '';
  return en || rw || '';
}

/** “3 min” style label with a safe fallback. */
export function readingMinutes(a: Article): number {
  if (a.readingMinutes && a.readingMinutes > 0) return a.readingMinutes;
  const words = `${a.body ?? ''} ${a.excerpt ?? ''}`.trim().split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / 190)) : 0;
}
