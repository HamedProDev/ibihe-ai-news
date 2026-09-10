'use client';

import Link from 'next/link';
import type { StoryCluster } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function StoryTimeline({ cluster }: { cluster: StoryCluster }) {
  const { s, locale } = useLocale();
  if (cluster.timeline.length < 2) return null;
  const sorted = [...cluster.timeline].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  return (
    <section aria-labelledby="timeline-h" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5">
      <h2 id="timeline-h" className="text-white text-[15px] font-bold mb-4">
        {locale === 'rw' ? s.article.timeline.rw : s.article.timeline.en}
      </h2>
      <ol className="relative border-l border-white/15 ml-1.5 space-y-4">
        {sorted.map((t) => (
          <li key={t.articleId} className="pl-4 relative">
            <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#00c853]" aria-hidden="true" />
            <time className="text-white/40 text-xs">
              {new Date(t.at).toLocaleDateString(locale === 'rw' ? 'rw-RW' : 'en-GB', { day: 'numeric', month: 'short' })}
            </time>
            <Link href={`/amakuru/${t.articleId}`} className="block text-white/80 text-sm hover:text-[#00c853] transition-colors">
              {locale === 'rw' ? t.headlineKiny : t.headlineEn}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
