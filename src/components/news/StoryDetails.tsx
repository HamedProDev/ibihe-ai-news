'use client';

import Link from 'next/link';
import { BadgeCheck, Calendar, Clock, Eye, Globe2, MapPin, Tag, Languages, User } from 'lucide-react';
import type { Article } from '@/types/news';
import type { LangEntry } from '@/lib/i18n/dictionaries';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { longDate } from '@/lib/i18n/timeago';
import { readingMinutes } from '@/lib/news/localize';
import type { Block } from '@/lib/media/markdown';

const RATING_STYLE: Record<string, string> = {
  true: 'border-ok/40 bg-ok/10 text-ok',
  'mostly-true': 'border-ok/30 bg-ok/10 text-ok',
  mixed: 'border-warn/40 bg-warn/10 text-warn',
  misleading: 'border-warn/40 bg-warn/10 text-warn',
  false: 'border-danger/40 bg-danger/10 text-danger',
  outdated: 'border-line-2 bg-fill text-ink/60',
  unverified: 'border-line-2 bg-fill text-ink/60',
};

/** "Everything we know about this story" block + verification verdict. */
export function StoryDetails({ article, blocks }: { article: Article; blocks: Block[] }) {
  const { t, s, locale } = useLocale();
  const countryEntry = (s.countries as unknown as Record<string, LangEntry>)[(article.country ?? '').toUpperCase()];
  const paragraphs = blocks.filter((b) => b.type === 'p' || b.type === 'h2' || b.type === 'h3').length;
  const rows: Array<{ icon: typeof Clock; label: string; value: React.ReactNode }> = [];

  if (article.authorName || article.authorId) {
    rows.push({
      icon: User,
      label: t(s.form.author),
      value: article.authorId ? (
        <Link href={`/amakuru?author=${encodeURIComponent(article.authorId)}`} className="text-brand-ink hover:underline">
          {article.authorName ?? article.authorId}
        </Link>
      ) : (
        (article.authorName ?? '—')
      ),
    });
  }
  rows.push({ icon: Tag, label: t(s.filters.category), value: t(s.categories[article.category]) });
  if (article.country && article.country !== 'RW') {
    rows.push({ icon: Globe2, label: t(s.filters.country), value: countryEntry ? t(countryEntry) : article.country });
  } else {
    rows.push({ icon: Globe2, label: t(s.filters.country), value: countryEntry ? t(countryEntry) : 'RW' });
  }
  if (article.district) rows.push({ icon: MapPin, label: t(s.form.country) === '' ? 'District' : t(s.markets.district), value: article.district });
  if (article.city) rows.push({ icon: MapPin, label: t(s.markets.market), value: article.city });
  rows.push({ icon: Calendar, label: t(s.article.publishedAt), value: longDate(article.publishedAt, locale) });
  if (article.updatedAt) rows.push({ icon: Calendar, label: t(s.article.updated), value: longDate(article.updatedAt, locale) });
  const minutes = readingMinutes(article);
  if (minutes) rows.push({ icon: Clock, label: t(s.admin.fields.readingTime), value: `${minutes} ${t(s.article.readingTime)}` });
  if (paragraphs) rows.push({ icon: Languages, label: t(s.common.language), value: (article.language ?? 'rw').toUpperCase() });
  if (typeof article.views === 'number') rows.push({ icon: Eye, label: t(s.article.views), value: article.views.toLocaleString() });

  const fc = article.factCheck;

  return (
    <section aria-label={t(s.article.details)} className="x-card x-card-pad mt-6">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink/60">{t(s.article.details)}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2 border-b border-line pb-2 last:border-b-0 sm:last:border-b">
            <r.icon size={13} className="mt-0.5 shrink-0 text-ink/35" aria-hidden />
            <dt className="w-24 shrink-0 text-ink/45">{r.label}</dt>
            <dd className="min-w-0 flex-1 text-ink/85">{r.value}</dd>
          </div>
        ))}
      </dl>

      {(article.tags?.length ?? 0) > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t(s.admin.tags)}>
          {article.tags.map((tag) => (
            <li key={tag}>
              <Link href={`/amakuru?tag=${encodeURIComponent(tag)}`} className="x-chip hover:border-line-3 hover:text-ink">
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {fc && (
        <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-[13px] ${RATING_STYLE[fc.rating] ?? RATING_STYLE.unverified}`}>
          <BadgeCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold capitalize">
              {t(s.article.lastVerified)}: {fc.rating.replace('-', ' ')}
            </p>
            {fc.notes && <p className="mt-1 text-ink/70">{fc.notes}</p>}
            {(fc.reviewedBy || fc.reviewedAt) && (
              <p className="mt-1 text-[11px] text-ink/50">
                {fc.reviewedBy ? `${fc.reviewedBy}${fc.reviewedAt ? ' · ' : ''}` : ''}
                {fc.reviewedAt ? longDate(fc.reviewedAt, locale) : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
