'use client';

import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import type { Article, NewsArticle } from '@/types';
import { ArticleImage } from '@/components/news/ArticleImage';
import { SaveButton } from '@/components/news/SaveButton';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { timeAgo } from '@/lib/i18n/timeago';
import { categoryChip } from '@/lib/news/category-style';
import type { SavedStory } from '@/lib/news/saved';

type CardArticle = Article | NewsArticle;

function sourceNameOf(a: CardArticle): string {
  if ('sources' in a && Array.isArray((a as Article).sources)) {
    return (a as Article).sources[0]?.name ?? 'IbiheNews';
  }
  return (a as NewsArticle).source ?? 'IbiheNews';
}

function imageOf(a: CardArticle): string | undefined {
  return 'imageUrl' in a && typeof a.imageUrl === 'string' ? a.imageUrl : undefined;
}

function authorOf(a: CardArticle): string | undefined {
  return 'authorName' in a && typeof a.authorName === 'string' && a.authorName ? a.authorName : undefined;
}

function viewsOf(a: CardArticle): number | undefined {
  return 'views' in a && typeof (a as Article).views === 'number' ? (a as Article).views : undefined;
}

export function toSavedStory(a: CardArticle): SavedStory {
  return {
    id: a.id,
    title: a.title,
    titleKiny: a.titleKiny,
    excerpt: a.excerpt,
    excerptKiny: a.excerptKiny,
    category: a.category,
    publishedAt: a.publishedAt,
    imageUrl: imageOf(a),
    sourceName: sourceNameOf(a),
    savedAt: new Date().toISOString(),
  };
}

function CategoryChip({ category, label, live }: { category: CardArticle['category']; label: string; live?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${categoryChip(category)}`}
    >
      {live && <span className="size-1.5 rounded-full bg-white animate-pulse" aria-hidden />}
      {label}
    </span>
  );
}

function Byline({ article }: { article: CardArticle }) {
  const { locale } = useLocale();
  const author = authorOf(article);
  const views = viewsOf(article);
  return (
    <div className="flex items-center gap-2 text-xs text-white/45 min-w-0">
      {author && (
        <span className="truncate font-medium text-white/60">
          {author}
        </span>
      )}
      {author && <span aria-hidden>•</span>}
      <span className="inline-flex items-center gap-1 shrink-0">
        <Clock size={11} aria-hidden />
        {timeAgo(article.publishedAt, locale)}
      </span>
      {typeof views === 'number' && views > 0 && (
        <span className="inline-flex items-center gap-1 shrink-0">
          <Eye size={11} aria-hidden />
          {views.toLocaleString()}
        </span>
      )}
    </div>
  );
}

/**
 * Mock-style card. Variants: grid (image top), row (thumb side),
 * overlay (hero lead), minimal (text only, for side lists).
 */
export default function NewsCard({
  article,
  variant = 'grid',
}: {
  article: CardArticle;
  variant?: 'grid' | 'row' | 'overlay' | 'minimal';
}) {
  const { t, s, locale } = useLocale();
  const title = locale === 'rw' ? article.titleKiny : article.title;
  const excerpt = locale === 'rw' ? article.excerptKiny : article.excerpt;
  const href = `/amakuru/${article.id}`;
  const image = imageOf(article);
  const catLabel = t(s.categories[article.category]);
  const live = article.category === 'imvurugano';

  if (variant === 'overlay') {
    return (
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-2xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]"
      >
        <article>
          <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
            <ArticleImage src={image} alt="" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <div className="mb-2 flex gap-2">
                <CategoryChip category={article.category} label={catLabel} live={live} />
              </div>
              <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl lg:text-[28px] line-clamp-3">
                {title}
              </h2>
              <p className="mt-1.5 hidden text-sm leading-relaxed text-white/70 sm:block line-clamp-2">{excerpt}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-white/60">{sourceNameOf(article)}</span>
                <span className="text-xs text-white/60">{timeAgo(article.publishedAt, locale)}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'row') {
    return (
      <Link
        href={href}
        className="group flex gap-3 rounded-xl border border-white/10 bg-[#111] p-3 transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]"
      >
        <div className="relative w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">
          <ArticleImage src={image} alt="" className="aspect-[4/3] w-full" />
        </div>
        <article className="min-w-0 flex-1">
          <div className="mb-1.5">
            <CategoryChip category={article.category} label={catLabel} live={live} />
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-white line-clamp-2 group-hover:text-[#00c853]">
            {title}
          </h3>
          <div className="mt-1.5">
            <Byline article={article} />
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'minimal') {
    return (
      <Link href={href} className="group flex items-start gap-3 py-2.5 focus:outline-none">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#00c853]" aria-hidden />
        <article className="min-w-0">
          <h4 className="text-sm font-medium leading-snug text-white/85 line-clamp-2 group-hover:text-[#00c853]">
            {title}
          </h4>
          <p className="mt-0.5 text-xs text-white/40">
            {sourceNameOf(article)} • {timeAgo(article.publishedAt, locale)}
          </p>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111] transition-colors hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]"
    >
      <article className="flex h-full flex-col">
        <div className="relative overflow-hidden">
          <ArticleImage src={image} alt="" className="aspect-[16/9] w-full" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2">
            <CategoryChip category={article.category} label={catLabel} live={live} />
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-white line-clamp-2 group-hover:text-[#00c853]">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55 line-clamp-2">{excerpt}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <Byline article={article} />
            <SaveButton story={toSavedStory(article)} size={15} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export { VideoBadge };
