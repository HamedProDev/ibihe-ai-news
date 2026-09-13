'use client';

import Link from 'next/link';
import { ChevronRight, Clock, Eye, Play } from 'lucide-react';
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

/** Thumbnails for the "has video" marker (first clip only, to stay cheap). */
function videoOf(a: CardArticle): { count: number; thumb?: string } {
  if (!('videos' in a) || !Array.isArray((a as Article).videos)) return { count: 0 };
  const list = (a as Article).videos ?? [];
  return { count: list.length, ...(list[0]?.thumbnailUrl ? { thumb: list[0].thumbnailUrl } : {}) };
}

function CategoryChip({ category, label, live }: { category: CardArticle['category']; label: string; live?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${categoryChip(category)}`}
    >
      {live && <span className="size-1.5 rounded-full bg-on-image animate-pulse" aria-hidden />}
      {label}
    </span>
  );
}

function VideoBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-image backdrop-blur-sm">
      <Play size={10} aria-hidden fill="currentColor" />
      {count > 1 ? `${count}` : 'Video'}
    </span>
  );
}

function Byline({ article }: { article: CardArticle }) {
  const { locale } = useLocale();
  const author = authorOf(article);
  const views = viewsOf(article);
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-ink/45">
      {author && <span className="truncate font-medium text-ink/60">{author}</span>}
      {author && <span aria-hidden>•</span>}
      <span className="inline-flex shrink-0 items-center gap-1">
        <Clock size={11} aria-hidden />
        {timeAgo(article.publishedAt, locale)}
      </span>
      {typeof views === 'number' && views > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1">
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
  const live = Boolean((article as Article).breaking);
  const video = videoOf(article);

  if (variant === 'overlay') {
    return (
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-2xl border border-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <article>
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[16/8]">
            <ArticleImage src={video.thumb ?? image} alt="" className="absolute inset-0" />
            <div className="absolute inset-0 x-wash" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 lg:p-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CategoryChip category={article.category} label={catLabel} live={live} />
                <VideoBadge count={video.count} />
              </div>
              <h2 className="text-lg font-bold leading-snug text-on-image x-clamp-3 sm:text-2xl lg:text-[28px]">{title}</h2>
              <p className="mt-1.5 hidden text-sm leading-relaxed text-on-image/70 x-clamp-2 sm:block">{excerpt}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-on-image/60">{sourceNameOf(article)}</span>
                <span className="text-xs text-on-image/60">{timeAgo(article.publishedAt, locale)}</span>
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
        className="group flex gap-3 rounded-xl border border-line bg-surface p-2.5 transition-colors hover:border-line-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-3"
      >
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg sm:w-32">
          <ArticleImage src={video.thumb ?? image} alt="" className="aspect-[4/3] w-full" />
          {video.count > 0 && (
            <span className="absolute bottom-1 start-1">
              <VideoBadge count={video.count} />
            </span>
          )}
        </div>
        <article className="min-w-0 flex-1">
          <div className="mb-1.5">
            <CategoryChip category={article.category} label={catLabel} live={live} />
          </div>
          <h3 className="x-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-ink">{title}</h3>
          <div className="mt-1.5">
            <Byline article={article} />
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'minimal') {
    return (
      <Link href={href} className="group flex items-start gap-2.5 py-2.5 focus:outline-none">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
        <article className="min-w-0">
          <h4 className="x-clamp-2 text-sm font-medium leading-snug text-ink/85 group-hover:text-brand-ink">{title}</h4>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/40">
            {sourceNameOf(article)} • {timeAgo(article.publishedAt, locale)}
            {video.count > 0 && <Play size={10} className="text-brand-ink" aria-hidden />}
          </p>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <article className="flex h-full flex-col">
        <div className="relative overflow-hidden">
          <ArticleImage src={video.thumb ?? image} alt="" className="aspect-[16/9] w-full" />
          {video.count > 0 && (
            <span className="absolute bottom-2 start-2">
              <VideoBadge count={video.count} />
            </span>
          )}
          {(article as Article).breaking && (
            <span className="absolute top-0 start-0 inline-flex items-center gap-1 bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-on-image">
              {t(s.admin.fields.breaking)}
              <ChevronRight size={11} aria-hidden />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="mb-2">
            <CategoryChip category={article.category} label={catLabel} live={live} />
          </div>
          <h3 className="x-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-ink">{title}</h3>
          <p className="mt-1.5 x-clamp-2 text-[13px] leading-relaxed text-ink/55">{excerpt}</p>
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
