'use client';

import Link from 'next/link';
import { Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Article, NewsArticle } from '@/types';
import { CategoryBadge, ContentStatusBadge } from '@/components/ui/Badges';
import { ArticleImage } from '@/components/news/ArticleImage';
import { useLocale } from '@/components/i18n/LanguageProvider';

type CardArticle = Article | NewsArticle;

function isFull(a: CardArticle): a is Article {
  return 'sources' in a && Array.isArray((a as Article).sources);
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function NewsCard({ article, variant = 'grid' }: { article: CardArticle; variant?: 'hero' | 'grid' | 'row' }) {
  const { locale, s } = useLocale();
  const title = locale === 'rw' ? article.titleKiny : article.title;
  const excerpt = locale === 'rw' ? article.excerptKiny : article.excerpt;
  const catLabel = locale === 'rw' ? s.categories[article.category].rw : s.categories[article.category].en;
  const full: Article | null = isFull(article) ? article : null;
  const legacy: NewsArticle | null = full ? null : (article as NewsArticle);
  const sourceName = full ? (full.sources[0]?.name ?? 'Ibihe') : (legacy?.source ?? 'Ibihe');
  const href = `/amakuru/${article.id}`;
  const image = 'imageUrl' in article && typeof article.imageUrl === 'string' ? article.imageUrl : undefined;

  if (variant === 'hero') {
    return (
      <Link href={href} className="block relative rounded-2xl overflow-hidden border border-white/10 group hover:border-[#00c853]/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]">
        <article>
          <div className="min-h-44 flex items-end relative overflow-hidden">
            <ArticleImage src={image} alt="" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />
            <div className="relative z-10 p-5">
              <div className="flex gap-2 mb-2 flex-wrap">
                <CategoryBadge category={article.category} label={catLabel} />
                {full && <ContentStatusBadge status={full.status} />}
              </div>
              <h2 className="text-white font-bold text-xl leading-snug">{title}</h2>
            </div>
          </div>
          <div className="p-4 bg-[#0d1a11]">
            <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">{excerpt}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">{sourceName}</span>
              <span className="flex items-center gap-1 text-white/40">
                <Clock size={11} aria-hidden="true" />
                {timeAgo(article.publishedAt)}
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/25 hover:bg-[#161616] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c853]">
      <article>
        {image && <ArticleImage src={image} alt="" className="h-32 w-full rounded-lg mb-3 border border-white/10" />}
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          <CategoryBadge category={article.category} label={catLabel} />
          {full && <ContentStatusBadge status={full.status} size="xs" />}
          {full?.isMock && (
            <span className="text-[10px] text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">
              demo
            </span>
          )}
        </div>
        <h3 className="text-white text-[15px] font-semibold leading-snug mb-1.5 group-hover:text-[#00c853] transition-colors">
          {title}
        </h3>
        {variant === 'row' && <p className="text-white/55 text-[13px] leading-relaxed mb-2 line-clamp-2">{excerpt}</p>}
        <div className="flex items-center justify-between text-xs text-white/40">
          <span className="inline-flex items-center gap-1">
            {sourceName}
            {full && full.sources.length > 1 && <span aria-label={`+${full.sources.length - 1}`}>+{full.sources.length - 1}</span>}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} aria-hidden="true" />
            {timeAgo(article.publishedAt)}
          </span>
        </div>
      </article>
    </Link>
  );
}

export function SourceLink({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#00c853] hover:underline text-[13px]"
      onClick={(e) => e.stopPropagation()}
    >
      {name}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}
