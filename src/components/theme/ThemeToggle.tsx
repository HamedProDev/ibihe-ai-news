'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { ThemeMode } from '@/lib/theme/theme';

const MODES: Array<{ id: ThemeMode; icon: typeof Sun }> = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
];

/**
 * Theme control: the icon button flips light <-> dark (one tap, what almost
 * everyone wants); the caret opens the full choice including "system", which
 * follows the OS and updates live.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, mode, setMode, toggle } = useTheme();
  const { t, s } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = t(s.theme.toggle);
  const next = theme === 'dark' ? t(s.theme.light) : t(s.theme.dark);
  const Icon = theme === 'light' ? Sun : Moon;
  const menuLabel = `${t(s.theme.light)} / ${t(s.theme.dark)} / ${t(s.theme.system)}`;

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggle}
          aria-label={`${label} — ${next}`}
          title={`${label} — ${next}`}
          className={`rounded-lg text-ink/60 transition-colors hover:bg-fill-2 hover:text-ink ${
            compact ? 'p-2' : 'p-2'
          }`}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={menuLabel}
          title={menuLabel}
          className="rounded-lg p-1 text-ink/40 transition-colors hover:bg-fill-2 hover:text-ink"
        >
          <span className="block size-3.5 rounded-full border border-current" aria-hidden />
          <span className="sr-only">{menuLabel}</span>
        </button>
      </div>

      {open && (
        <div
          role="menu"
          aria-label={menuLabel}
          dir="ltr"
          className="absolute end-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]"
        >
          {MODES.map(({ id, icon: ModeIcon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => {
                  setMode(id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-start text-[13px] transition-colors ${
                  active ? 'bg-brand/10 text-brand-ink' : 'text-ink/75 hover:bg-fill-2 hover:text-ink'
                }`}
              >
                <ModeIcon size={15} aria-hidden="true" />
                <span className="flex-1">{t(s.theme[id])}</span>
                {active && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
