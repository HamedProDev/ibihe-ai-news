'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Article } from '@/types';
import NewsCard from '@/components/news/NewsCard';
import { useLocale } from '@/components/i18n/LanguageProvider';

/**
 * Lead story (big overlay) + up to two side cards + "read full story" link.
 * Presentational — the page fetches and passes slices.
 */
export function HeroSection({ lead, side }: { lead: Article | null; side: Article[] }) {
  const { t, s } = useLocale();
  if (!lead) return null;
  return (
    <section aria-label="Top story" className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <NewsCard article={lead} variant="overlay" />
        <Link
          href={`/amakuru/${lead.id}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-bright"
        >
          {t(s.home.readStory)}
          <ArrowRight size={15} aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {side.slice(0, 2).map((a) => (
          <NewsCard key={a.id} article={a} variant="row" />
        ))}
      </div>
    </section>
  );
}
