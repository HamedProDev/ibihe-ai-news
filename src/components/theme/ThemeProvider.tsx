'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  THEME_COOKIE,
  THEME_LEGACY_KEY,
  THEME_MODE_KEY,
  isThemeMode,
  resolveTheme,
  themeCookieString,
  type Theme,
  type ThemeMode,
} from '@/lib/theme/theme';

interface ThemeContextValue {
  /** The theme actually painted ('dark' | 'light'). */
  theme: Theme;
  /** What the user picked (may be 'system'). */
  mode: ThemeMode;
  /** True when the OS prefers a light appearance (mode === 'system' follows it). */
  systemPrefersLight: boolean;
  setMode: (mode: ThemeMode) => void;
  /** Quick flip: light <-> dark (leaves 'system' for an explicit choice). */
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeContextValue>({
  theme: 'dark',
  mode: 'dark',
  systemPrefersLight: false,
  setMode: () => undefined,
  toggle: () => undefined,
});

function readStoredMode(): ThemeMode | null {
  try {
    const raw = window.localStorage.getItem(THEME_MODE_KEY);
    if (isThemeMode(raw)) return raw;
    // Legacy key stored a resolved theme; migrate it to an explicit mode.
    const legacy = window.localStorage.getItem(THEME_LEGACY_KEY);
    if (legacy === 'light' || legacy === 'dark') return legacy;
  } catch {
    /* private mode / storage disabled — fall back to the SSR attribute */
  }
  return null;
}

/**
 * Owns `html[data-theme]`, the `dark` class, `color-scheme`, the browser
 * theme-color and the SSR cookie. No styled-component tricks: every surface
 * reads CSS variables (see globals.css), so one attribute flip re-skins all.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode() ?? 'dark');
  const [systemPrefersLight, setSystemPrefersLight] = useState(false);

  // Track the OS preference live (used when mode === 'system').
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const on = () => setSystemPrefersLight(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Adopt whatever the pre-paint script decided on the server, on first mount.
  useEffect(() => {
    if (readStoredMode()) return;
    const painted = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration sync
    setModeState((prev) => (prev === 'dark' ? painted : prev));
    try {
      window.localStorage.removeItem(THEME_LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const theme = useMemo(() => resolveTheme(mode, systemPrefersLight), [mode, systemPrefersLight]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_MODE_KEY, mode);
      // Persist for the server too, so reloads and SSR don't flash.
      document.cookie = themeCookieString(mode);
    } catch {
      /* storage disabled — theme still applies for this page view */
    }
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', theme === 'light' ? '#f5f5f2' : '#0a0a0a');
  }, [mode, theme]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggle = useCallback(
    () => setModeState((prev) => (resolveTheme(prev, systemPrefersLight) === 'dark' ? 'light' : 'dark')),
    [systemPrefersLight],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, systemPrefersLight, setMode, toggle }),
    [theme, mode, systemPrefersLight, setMode, toggle],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeCtx);
}

export type { Theme, ThemeMode };
export { THEME_COOKIE };
