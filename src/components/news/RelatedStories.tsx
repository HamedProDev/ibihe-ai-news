'use client';

import type { Article } from '@/types';
import NewsCard from './NewsCard';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function RelatedStories({ articles }: { articles: Article[] }) {
  const { s, locale } = useLocale();
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="related-h">
      <h2 id="related-h" className="text-white text-[15px] font-bold mb-3">
        {locale === 'rw' ? s.article.related.rw : s.article.related.en}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((a) => (
          <NewsCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
