'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function SearchBar({ initial = '', autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const { t, s} = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      role="search"
      aria-label={t(s.search.label)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/amakuru?q=${encodeURIComponent(q)}` : '/amakuru');
      }}
      className="relative w-full"
    >
      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(s.search.placeholder)}
        aria-label={t(s.search.label)}
        className="w-full bg-fill border border-line-2 rounded-xl ps-9 pe-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-brand/60 focus:bg-surface"
      />
    </form>
  );
}
