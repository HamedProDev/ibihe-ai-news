'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LOCALE_META,
  STRINGS,
  isLocale,
  tx,
  type LangEntry,
  type Locale,
  type Strings,
} from '@/lib/i18n/dictionaries';
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, RTL_LOCALES } from '@/lib/theme/theme';

export type { Locale };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  s: Strings;
  /** Pick a localized string with an en→rw fallback. */
  t: (entry: LangEntry) => string;
  /** Pick a legacy bilingual string. */
  pick: (entry: { rw: string; en: string }) => string;
  dir: 'ltr' | 'rtl';
  label: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = LOCALE_STORAGE_KEY;

function readSavedLocale(): Locale | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
    const cookie = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([a-z]{2})`));
    if (cookie && isLocale(cookie[1])) return cookie[1];
  } catch {
    /* storage unavailable — stay Kinyarwanda-first */
  }
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('rw');

  useEffect(() => {
    // Hydrate the saved locale once on mount (the pre-paint script already
    // applied lang/dir, so this only syncs React state with it).
    const saved = readSavedLocale();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration from storage
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      // Also visible to the server: keeps <html lang/dir> correct on reload.
      document.cookie = `${LOCALE_COOKIE}=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }, []);

  const dir: 'ltr' | 'rtl' = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
  const label = LOCALE_META.find((m) => m.code === locale)?.label ?? locale;

  useEffect(() => {
    // Keep <html lang>/<html dir> in sync for screen readers + RTL layout.
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    } catch {
      /* non-DOM */
    }
  }, [locale, dir]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      s: STRINGS,
      t: (entry) => tx(locale, entry),
      pick: (entry) => (locale === 'rw' ? entry.rw : entry.en),
      dir,
      label,
    }),
    [locale, setLocale, dir, label],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LanguageProvider');
  return ctx;
}
