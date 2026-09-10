'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function SearchBar({ initial = '', autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const { s, locale } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      role="search"
      aria-label={locale === 'rw' ? s.search.label.rw : s.search.label.en}
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/amakuru?q=${encodeURIComponent(q)}` : '/amakuru');
      }}
      className="relative w-full"
    >
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={locale === 'rw' ? s.search.placeholder.rw : s.search.placeholder.en}
        aria-label={locale === 'rw' ? s.search.label.rw : s.search.label.en}
        className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#00c853]/60 focus:bg-white/[0.07]"
      />
    </form>
  );
}
