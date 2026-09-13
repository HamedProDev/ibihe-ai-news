'use client';

import { useMemo, useState } from 'react';
import { Check, Eye, Link2, ListChecks, Radio, Share2 } from 'lucide-react';
import type { Article, StoryCluster, WhyItMatters } from '@/types';
import type { DataMode } from '@/types';
import { AIBadge, CategoryBadge, ContentStatusBadge, DemoBanner } from '@/components/ui/Badges';
import { EvidenceList } from './EvidenceList';
import { WhyMatters } from './WhyMatters';
import { RelatedStories } from './RelatedStories';
import { StoryTimeline } from './StoryTimeline';
import { StoryDetails } from './StoryDetails';
import { Comments } from './Comments';
import { GalleryStrip } from './GalleryStrip';
import { ArticleImage } from './ArticleImage';
import { Attachments, AudioNarration } from './StoryExtras';
import { VideoPlayer } from './VideoPlayer';
import { Prose } from './Prose';
import { SaveButton } from './SaveButton';
import { toSavedStory } from './NewsCard';
import { longDate } from '@/lib/i18n/timeago';
import { parseBody } from '@/lib/media/markdown';
import { readingMinutes, storyStrings } from '@/lib/news/localize';
import { useLocale } from '@/components/i18n/LanguageProvider';

/**
 * The full story page: hero (video or photo), body, gallery, documents,
 * verification, everything we know about the report, then discussion.
 */
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
  const { t, s, locale } = useLocale();
  const [copied, setCopied] = useState(false);
  // Readers can flip the story itself between Kinyarwanda and English without
  // changing the whole UI language.
  const [langOverride, setLangOverride] = useState<'rw' | 'en' | null>(null);
  const shown = langOverride ?? locale;
  const strings = useMemo(() => storyStrings(article, shown), [article, shown]);
  const blocks = useMemo(() => parseBody(strings.body), [strings.body]);

  const videos = article.videos ?? [];
  const heroVideo = videos.find((v) => v.placement === 'hero') ?? null;
  const inBody = new Set(blocks.filter((b) => b.type === 'video').map((b) => (b as { id: string }).id));
  const trailingVideos = videos.filter((v) => !inBody.has(v.id) && v.placement !== 'hero');
  const minutes = readingMinutes(article);
  const toggleable = Boolean(article.titleKiny && article.title && article.titleKiny !== article.title);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: strings.title, text: strings.excerpt, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* user dismissed the sheet */
    }
  };

  return (
    <article className="x-container-narrow py-5 sm:py-7">
      <DemoBanner mode={article.isMock ? 'demo' : dataMode} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CategoryBadge category={article.category} label={t(s.categories[article.category])} />
        <ContentStatusBadge status={article.status} />
        {article.breaking && (
          <span className="inline-flex items-center gap-1 rounded border border-danger/40 bg-danger/15 px-2 py-0.5 text-[11px] font-bold uppercase text-danger">
            <Radio size={11} aria-hidden />
            {t(s.admin.fields.breaking)}
          </span>
        )}
        {article.sponsored && <span className="x-chip">{t(s.article.sponsored)}</span>}
        {article.premium && <span className="x-chip border-brand/40 text-brand-ink">{t(s.article.premium)}</span>}
        {article.generated && <AIBadge ai={article.generated} />}
        {videos.length > 0 && <span className="x-chip border-brand/30 text-brand-ink">{t(s.article.videoStory)}</span>}
      </div>

      {(heroVideo || (article.imageUrl && !blocks.some((b) => b.type === 'image'))) && (
        <div className="mb-4">
          {heroVideo ? (
            <VideoPlayer video={heroVideo} eager />
          ) : (
            <figure>
              <ArticleImage
                src={article.imageUrl}
                alt={strings.title}
                className="aspect-video w-full overflow-hidden rounded-2xl border border-line"
              />
              {(article.imageCaption || article.imageCredit) && (
                <figcaption className="mt-2 text-xs leading-relaxed text-ink/45">
                  {locale === 'rw' && article.imageCaptionKiny ? article.imageCaptionKiny : article.imageCaption}
                  {article.imageCredit && <span className="ms-1 opacity-70">· {article.imageCredit}</span>}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      )}

      <h1 className="x-title-1 mb-2 text-ink">{strings.title}</h1>
      {strings.title !== article.titleKiny && article.titleKiny && shown !== 'rw' && (
        <p className="mb-2 text-[15px] leading-snug text-ink/45">{article.titleKiny}</p>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink/50">
          {article.authorName && (
            <span className="font-semibold text-ink/80">
              {t(s.article.by)} {article.authorName}
            </span>
          )}
          <span>{article.sources[0]?.name ?? 'IbiheNews'}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt}>{longDate(article.publishedAt, locale)}</time>
          {article.updatedAt && <span className="text-[12px]">({t(s.article.updated)} {longDate(article.updatedAt, locale)})</span>}
          {minutes > 0 && (
            <span className="x-chip !py-0">
              {minutes} {t(s.article.readingTime)}
            </span>
          )}
          {typeof article.views === 'number' && article.views > 0 && (
            <span className="inline-flex items-center gap-1">
              <Eye size={12} aria-hidden />
              {article.views.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <SaveButton story={toSavedStory(article)} />
          <button type="button" onClick={share} className="x-btn x-btn--ghost x-btn--icon" aria-label={t(s.article.share)} title={t(s.article.share)}>
            {copied ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
          </button>
          {copied && <span className="text-[11px] text-brand-ink">{t(s.article.copied)}</span>}
          {toggleable && (
            <button
              type="button"
              onClick={() => setLangOverride(shown === 'rw' ? 'en' : 'rw')}
              aria-pressed={langOverride !== null}
              className="x-btn x-btn--ghost x-btn--sm"
            >
              <Link2 size={12} aria-hidden />
              {shown === 'rw' ? 'English' : 'Kinyarwanda'}
            </button>
          )}
        </div>
      </div>

      <section aria-labelledby="what-h" className="mb-5">
        <h2 id="what-h" className="sr-only">
          {t(s.article.whatHappened)}
        </h2>
        <p className="text-[17px] leading-relaxed text-ink/90">{strings.excerpt}</p>
      </section>

      {strings.keyPoints.length > 0 && (
        <section aria-labelledby="keys-h" className="x-inset mb-6 p-4 sm:p-5">
          <h2 id="keys-h" className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
            <ListChecks size={16} className="text-brand-ink" aria-hidden="true" />
            {t(s.article.keyPoints)}
          </h2>
          <ul className="space-y-2.5">
            {strings.keyPoints.map((k, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink/80">
                <Check size={15} className="mt-1 shrink-0 text-brand-ink" aria-hidden="true" />
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      {blocks.length > 0 ? (
        <Prose blocks={blocks} videos={videos} eagerFirstVideo={!heroVideo} />
      ) : (
        trailingVideos.length === 0 && (
          <p className="text-[15px] leading-relaxed text-ink/70">{strings.excerpt}</p>
        )
      )}

      {trailingVideos.length > 0 && (
        <section aria-label={t(s.article.videoStory)} className="mt-6 space-y-4">
          {trailingVideos.map((v) => (
            <VideoPlayer key={v.id} video={v} />
          ))}
        </section>
      )}

      {(article.gallery?.length ?? 0) > 0 && <GalleryStrip images={article.gallery!} />}
      {article.audioUrl && <AudioNarration src={article.audioUrl} />}
      {(article.attachments?.length ?? 0) > 0 && <Attachments items={article.attachments!} />}

      <div className="space-y-6 pt-6">
        <WhyMatters items={whyItMatters} />
        {cluster && <StoryTimeline cluster={cluster} />}
        <EvidenceList sources={article.sources} />
        <StoryDetails article={article} blocks={blocks} />
        <RelatedStories articles={related} />
      </div>

      <Comments articleId={article.id} enabled={article.allowComments !== false} />
    </article>
  );
}
