'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import type { Article } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { timeAgo } from '@/lib/i18n/timeago';
import { categoryChip } from '@/lib/news/category-style';

function readArticles(json: unknown): Article[] {
  if (!json || typeof json !== 'object') return [];
  const o = json as Record<string, unknown>;
  const data = o.data as Record<string, unknown> | undefined;
  const list = data?.articles ?? o.articles;
  return Array.isArray(list) ? (list as Article[]) : [];
}

/** Numbered trending strip (most-read this week). */
export function TrendingStrip() {
  const { t, s, locale } = useLocale();
  const [items, setItems] = useState<Article[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/news?sort=views&time=7d&limit=4')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (alive) setItems(readArticles(json).slice(0, 4));
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="trending-h" className="rounded-2xl border border-ink/10 bg-brand/10 p-4 sm:p-5">
      <h2 id="trending-h" className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
        <Flame size={18} className="text-alert" aria-hidden />
        {t(s.trending.title)}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a, i) => (
          <li key={a.id}>
            <Link href={`/amakuru/${a.id}`} className="group flex gap-3 focus:outline-none">
              <span
                aria-hidden
                className="text-4xl font-extrabold leading-none text-ink/10 transition-colors group-hover:text-brand-ink/40"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span
                  className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryChip(a.category)}`}
                >
                  {t(s.categories[a.category])}
                </span>
                <span className="block text-sm font-semibold leading-snug text-ink line-clamp-3 group-hover:text-brand-ink">
                  {locale === 'rw' ? a.titleKiny : a.title}
                </span>
                <span className="mt-1 block text-xs text-ink/40">
                  {timeAgo(a.publishedAt, locale)}
                  {typeof a.views === 'number' && a.views > 0 && ` • ${a.views.toLocaleString()} ${t(s.trending.views)}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
