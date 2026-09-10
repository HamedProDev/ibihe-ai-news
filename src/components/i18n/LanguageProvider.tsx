'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS, type Locale, type Strings } from '@/lib/i18n/dictionaries';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  s: Strings;
  /** Pick a bilingual string. */
  pick: (entry: { rw: string; en: string }) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = 'ibihe-locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('rw');

  useEffect(() => {
    // Hydrate the saved locale once on mount (client-only; SSR stays 'rw').
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration from localStorage
      if (saved === 'rw' || saved === 'en') setLocaleState(saved);
      // Keep <html lang> in sync for screen readers.
      document.documentElement.lang = saved === 'en' ? 'en' : 'rw';
    } catch {
      /* storage unavailable — stay Kinyarwanda-first */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      s: STRINGS,
      pick: (entry) => (locale === 'rw' ? entry.rw : entry.en),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LanguageProvider');
  return ctx;
}
