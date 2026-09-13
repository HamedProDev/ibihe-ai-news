/**
 * Theme mode helpers — shared by the SSR root layout, the client provider and
 * the pre-paint inline script.
 *
 * Storage:
 *  • localStorage `ibihe-theme-mode`  → 'dark' | 'light' | 'system' (client, instant)
 *  • cookie `ibihe_theme`             → same value (lets the server render the
 *    correct `data-theme`, so there is no flash on first paint / reload).
 */
export type ThemeMode = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';

export const THEME_MODE_KEY = 'ibihe-theme-mode';
/** @deprecated legacy key ('dark' | 'light' only) — still migrated. */
export const THEME_LEGACY_KEY = 'ibihe-theme';
export const THEME_COOKIE = 'ibihe_theme';

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'dark' || v === 'light' || v === 'system';
}

/** Resolve a mode (+ the OS preference) to the theme actually applied. */
export function resolveTheme(mode: ThemeMode, systemPrefersLight: boolean): Theme {
  if (mode === 'system') return systemPrefersLight ? 'light' : 'dark';
  return mode === 'light' ? 'light' : 'dark';
}

/** Cookie string used from the client (readable by the server on next load). */
export function themeCookieString(mode: ThemeMode): string {
  return `${THEME_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/** Locales that render right-to-left (kept in sync with dictionaries.ts).
 *  Rwanda's four working languages are all LTR; the hook stays so an RTL
 *  locale can return without touching the pre-paint script. */
export const RTL_LOCALES: string[] = [];
export const LOCALE_COOKIE = 'ibihe_locale';
export const LOCALE_STORAGE_KEY = 'ibihe-locale';

/**
 * Pre-paint script (inlined in <head>). Mirrors the CSS contract in
 * globals.css: `html[data-theme="light"]` swaps the token values. It also
 * applies the saved language + direction, so RTL never flashes LTR.
 * Doing this here (instead of reading cookies in the root layout) keeps every
 * page statically renderable.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var m=localStorage.getItem('${THEME_MODE_KEY}');if(m!=='dark'&&m!=='light'&&m!=='system'){var l=localStorage.getItem('${THEME_LEGACY_KEY}');if(l==='light'||l==='dark')m=l;}if(m!=='dark'&&m!=='light'&&m!=='system'){var c=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(dark|light|system)/);if(c)m=c[1];}if(m!=='dark'&&m!=='light'&&m!=='system')m='dark';var light=m==='light'||(m==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches);d.dataset.theme=light?'light':'dark';d.classList.toggle('dark',!light);d.style.colorScheme=light?'light':'dark';var mc=document.querySelector('meta[name="theme-color"]');if(mc)mc.setAttribute('content',light?'#f5f5f2':'#0a0a0a');}catch(e){}try{var lv=localStorage.getItem('${LOCALE_STORAGE_KEY}');if(!lv){var lc=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([a-z]{2})/);if(lc)lv=lc[1];}if(lv){d.lang=lv;d.dir=${JSON.stringify(RTL_LOCALES)}.indexOf(lv)>=0?'rtl':'ltr';}}catch(e){}})();`;
