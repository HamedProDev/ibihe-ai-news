import type { Locale } from './dictionaries';

/** BCP-47 tags for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  rw: 'rw',
  en: 'en',
  fr: 'fr',
  sw: 'sw',
  ar: 'ar',
  ha: 'ha',
};

/**
 * Relative time ("3 hours ago") in the UI language. Falls back to English
 * when the runtime lacks locale data.
 */
export function timeAgo(iso: string, locale: Locale, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffSec = Math.round((t - now) / 1000);
  const abs = Math.abs(diffSec);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs || unit === 'second') {
      const value = Math.round(diffSec / secs);
      try {
        return new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: 'auto' }).format(value, unit);
      } catch {
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
      }
    }
  }
  return '';
}

/** Long date ("12 September 2026") in the UI language. */
export function longDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  try {
    return d.toLocaleDateString(INTL_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
