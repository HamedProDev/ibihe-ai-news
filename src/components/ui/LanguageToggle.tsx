'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { LOCALE_META } from '@/lib/i18n/dictionaries';

/**
 * 6-language switcher (RW/EN/FR/SW/AR/HA). Compact pill shows the active
 * language; clicking opens a dropdown with flags + native names.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t, s } = useLocale();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const active = LOCALE_META.find((m) => m.code === locale) ?? LOCALE_META[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(s.common.chooseLanguage)}
        className={`flex items-center gap-1.5 bg-fill border border-line-2 rounded-lg font-semibold uppercase tracking-wide transition-colors hover:border-line-3 ${compact ? 'text-[11px] px-2 py-1.5' : 'text-xs px-2.5 py-1.5'}`}
      >
        <Globe size={compact ? 12 : 14} className="text-brand-ink" aria-hidden />
        <span aria-hidden>{active.flag}</span>
        <span>{active.short}</span>
        <ChevronDown size={12} className={`text-ink/50 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t(s.common.chooseLanguage)}
          className="absolute end-0 mt-1.5 max-h-[60dvh] min-w-44 overflow-y-auto rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)] z-50"
        >
          {LOCALE_META.map((m) => (
            <li key={m.code}>
              <button
                role="option"
                aria-selected={m.code === locale}
                onClick={() => {
                  setLocale(m.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors ${
                  m.code === locale ? 'bg-brand/15 text-ink' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <span aria-hidden className="text-base leading-none">{m.flag}</span>
                <span className="flex-1" dir={m.dir}>{m.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{m.short}</span>
                {m.code === locale && <Check size={14} className="text-brand-ink" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Back-compat alias. */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  return <LanguageSwitcher compact={compact} />;
}
