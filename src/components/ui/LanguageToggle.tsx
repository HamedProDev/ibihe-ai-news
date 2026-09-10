'use client';

import { useLocale } from '@/components/i18n/LanguageProvider';

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      role="group"
      aria-label="Ururimi / Language"
      className={`flex items-center bg-white/5 border border-white/15 rounded-lg overflow-hidden ${compact ? 'text-[11px]' : 'text-xs'}`}
    >
      {(['rw', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-2.5 py-1.5 font-semibold uppercase tracking-wide transition-colors ${
            locale === l ? 'bg-[#00c853] text-black' : 'text-white/55 hover:text-white'
          }`}
        >
          {l === 'rw' ? 'RW' : 'EN'}
        </button>
      ))}
    </div>
  );
}
