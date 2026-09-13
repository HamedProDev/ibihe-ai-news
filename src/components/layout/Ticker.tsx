'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { Article } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';

function readArticles(json: unknown): Article[] {
  if (!json || typeof json !== 'object') return [];
  const o = json as Record<string, unknown>;
  const data = o.data as Record<string, unknown> | undefined;
  const list = data?.articles ?? o.articles;
  return Array.isArray(list) ? (list as Article[]) : [];
}

/** Breaking-news ticker: red bar, live badge, auto-scrolling headlines. */
export function Ticker() {
  const { t, s, locale } = useLocale();
  const [items, setItems] = useState<Article[]>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/news?time=24h&limit=10')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (alive) setItems(readArticles(json).slice(0, 10));
      })
      .catch(() => undefined);
    // The console can switch the strip off (settings → homepage sections).
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json: { data?: { settings?: { home?: { showTicker?: boolean }, ticker?: { maxItems?: number } } } }) => {
        if (!alive || !json.data?.settings) return;
        setEnabled(json.data.settings.home?.showTicker !== false);
        const cap = json.data.settings.ticker?.maxItems;
        if (typeof cap === 'number') setItems((prev) => prev.slice(0, cap));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled || items.length === 0) return null;

  const doubled = [...items, ...items];
  return (
    <div className="bg-red-600 text-on-image" role="marquee" aria-label={t(s.ticker.latest)}>
      <div className="x-container flex items-stretch !px-0">
        <span className="flex shrink-0 items-center gap-1.5 bg-red-700 px-3 py-2 text-xs font-bold uppercase tracking-wide">
          <Zap size={13} aria-hidden />
          {t(s.ticker.live)}
        </span>
        <div className="relative flex-1 overflow-hidden" dir="ltr">
          <div className="animate-ticker flex w-max items-center gap-8 whitespace-nowrap py-2 ps-4">
            {doubled.map((a, i) => (
              <Link
                key={`${a.id}-${i}`}
                href={`/amakuru/${a.id}`}
                className="text-[13px] font-medium hover:underline focus:outline-none focus-visible:underline"
                tabIndex={i < items.length ? 0 : -1}
                aria-hidden={i >= items.length}
              >
                {locale === 'rw' ? a.titleKiny : a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
