'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_META, STRINGS, isLocale, tx, type LangEntry, type Locale, type Strings } from '@/lib/i18n/dictionaries';

export type { Locale };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  s: Strings;
  /** Pick a 6-language string with en→rw fallback. */
  t: (entry: LangEntry) => string;
  /** Pick a legacy bilingual string. */
  pick: (entry: { rw: string; en: string }) => string;
  dir: 'ltr' | 'rtl';
  label: string;
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
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* storage unavailable — stay Kinyarwanda-first */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const dir = LOCALE_META.find((m) => m.code === locale)?.dir ?? 'ltr';
  const label = LOCALE_META.find((m) => m.code === locale)?.label ?? locale;

  useEffect(() => {
    // Keep <html lang>/<html dir> in sync for screen readers + RTL.
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
