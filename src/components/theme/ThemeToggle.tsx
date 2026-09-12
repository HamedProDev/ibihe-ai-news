'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const { s, locale } = useLocale();
  const label = locale === 'rw' ? s.theme.toggle.rw : s.theme.toggle.en;
  const next = theme === 'dark' ? (locale === 'rw' ? s.theme.light.rw : s.theme.light.en) : (locale === 'rw' ? s.theme.dark.rw : s.theme.dark.en);
  return (
    <button
      onClick={toggle}
      aria-label={`${label} — ${next}`}
      title={`${label} — ${next}`}
      className={`${compact ? 'p-2' : 'p-2'} text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors`}
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
