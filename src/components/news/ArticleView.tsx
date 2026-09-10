'use client';

import { useState } from 'react';
import { Check, ListChecks } from 'lucide-react';
import type { Article, StoryCluster, WhyItMatters } from '@/types';
import { CategoryBadge, ContentStatusBadge, AIBadge, DemoBanner } from '@/components/ui/Badges';
import type { DataMode } from '@/types';
import { EvidenceList } from './EvidenceList';
import { WhyMatters } from './WhyMatters';
import { RelatedStories } from './RelatedStories';
import { StoryTimeline } from './StoryTimeline';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function ArticleView({
  article,
  related,
  cluster,
  whyItMatters,
  dataMode,
}: {
  article: Article;
  related: Article[];
  cluster: StoryCluster | null;
  whyItMatters: WhyItMatters[];
  dataMode: DataMode;
}) {
  const { s, locale } = useLocale();
  const [showEn, setShowEn] = useState(false);
  const useEn = locale === 'en' || showEn;
  const keyPoints = useEn && article.keyPointsEn.length > 0 ? article.keyPointsEn : article.keyPointsKiny;

  return (
    <article className="max-w-3xl mx-auto">
      <DemoBanner mode={article.isMock ? 'demo' : dataMode} />

      <div className="flex gap-2 flex-wrap mb-3">
        <CategoryBadge category={article.category} label={locale === 'rw' ? s.categories[article.category].rw : s.categories[article.category].en} />
        <ContentStatusBadge status={article.status} />
        {article.generated && <AIBadge ai={article.generated} />}
      </div>

      <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-2">
        {useEn ? article.title : article.titleKiny}
      </h1>

      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-white/45 text-[13px]">
          {article.sources[0]?.name ?? 'Ibihe'}
          {' · '}
          {new Date(article.publishedAt).toLocaleDateString(locale === 'rw' ? 'rw-RW' : 'en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
        <button
          onClick={() => setShowEn((v) => !v)}
          aria-pressed={showEn}
          className="shrink-0 text-xs font-medium text-white/60 border border-white/15 rounded-lg px-2.5 py-1.5 hover:text-white hover:border-white/30"
        >
          {showEn ? 'Soma mu Kinyarwanda' : 'Read in English'}
        </button>
      </div>

      <section aria-labelledby="what-h" className="mb-6">
        <h2 id="what-h" className="sr-only">{locale === 'rw' ? s.article.whatHappened.rw : s.article.whatHappened.en}</h2>
        <p className="text-white/85 text-[17px] leading-relaxed">{useEn ? article.excerpt : article.excerptKiny}</p>
      </section>

      {keyPoints.length > 0 && (
        <section aria-labelledby="keys-h" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6">
          <h2 id="keys-h" className="flex items-center gap-2 text-white text-[15px] font-bold mb-3">
            <ListChecks size={16} className="text-[#00c853]" aria-hidden="true" />
            {locale === 'rw' ? s.article.keyPoints.rw : s.article.keyPoints.en}
          </h2>
          <ul className="space-y-2.5">
            {keyPoints.map((k, i) => (
              <li key={i} className="flex items-start gap-2.5 text-white/75 text-[15px] leading-relaxed">
                <Check size={15} className="text-[#00c853] mt-1 shrink-0" aria-hidden="true" />
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      {article.entities.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-6" aria-label={locale === 'rw' ? 'Abantu n’ibintu bivugwamo' : 'Mentioned entities'}>
          {article.entities.slice(0, 10).map((e, i) => (
            <span key={i} className="text-[11px] text-white/50 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
              {e.normalized}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <WhyMatters items={whyItMatters} />
        {cluster && <StoryTimeline cluster={cluster} />}
        <EvidenceList sources={article.sources} />
        <RelatedStories articles={related} />
      </div>
    </article>
  );
}
