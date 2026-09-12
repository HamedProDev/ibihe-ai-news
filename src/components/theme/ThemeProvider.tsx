'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => undefined });

const STORAGE_KEY = 'ibihe-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Sync from the pre-paint script value on mount.
    const current = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time theme hydration
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode — ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  return useContext(ThemeCtx);
}
