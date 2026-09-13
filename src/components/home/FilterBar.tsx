'use client';

import { RotateCcw } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { NewsCategory } from '@/types/news';
import { CATEGORY_SLUGS } from '@/lib/news/category-registry';

export interface NewsFilters {
  time: '24h' | '7d' | '30d' | 'all';
  country: string;
  category: NewsCategory | 'all';
}

export const DEFAULT_FILTERS: NewsFilters = { time: 'all', country: 'all', category: 'all' };

const CATEGORIES: Array<NewsCategory | 'all'> = ['all', ...CATEGORY_SLUGS];

const selectCls =
  'rounded-xl border border-ink/15 bg-surface-2 px-3 py-2 text-[13px] font-medium text-ink focus:border-brand/60 focus:outline-none [&>option]:bg-surface-2';

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{label}</span>
      {children}
    </label>
  );
}

export function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: NewsFilters;
  onChange: (f: NewsFilters) => void;
  onClear: () => void;
}) {
  const { t, s } = useLocale();
  const dirty = filters.time !== 'all' || filters.category !== 'all';

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label={t(s.filters.time)} htmlFor="f-time">
        <select
          id="f-time"
          className={selectCls}
          value={filters.time}
          onChange={(e) => onChange({ ...filters, time: e.target.value as NewsFilters['time'] })}
        >
          <option value="all">{t(s.filters.anytime)}</option>
          <option value="24h">{t(s.filters.last24h)}</option>
          <option value="7d">{t(s.filters.last7d)}</option>
          <option value="30d">{t(s.filters.last30d)}</option>
        </select>
      </Field>
      <Field label={t(s.filters.category)} htmlFor="f-category">
        <select
          id="f-category"
          className={selectCls}
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as NewsFilters['category'] })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? t(s.filters.allCategories) : t(s.categories[c])}
            </option>
          ))}
        </select>
      </Field>
      {dirty && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2 text-[13px] font-medium text-ink/60 hover:border-ink/30 hover:text-ink"
        >
          <RotateCcw size={13} aria-hidden />
          {t(s.filters.clear)}
        </button>
      )}
    </div>
  );
}
