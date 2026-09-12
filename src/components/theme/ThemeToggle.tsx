'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const { t, s} = useLocale();
  const label = t(s.theme.toggle);
  const next = theme === 'dark' ? (t(s.theme.light)) : (t(s.theme.dark));
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
