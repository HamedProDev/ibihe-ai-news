import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticle } from '@/lib/news/store';
import { buildWhyItMatters } from '@/lib/news/why-matters';
import { ArticleView } from '@/components/news/ArticleView';
import { ViewPing } from '@/components/news/ViewPing';
import { isSafeEmbedUrl } from '@/lib/media/video';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ibihenews.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { article } = await getArticle(id);
  if (!article) return { title: 'Ntibonetse' };
  const seo = article.seo ?? {};
  const title = seo.title || article.titleKiny || article.title;
  const description = (seo.description || article.excerptKiny || article.excerpt).slice(0, 200);
  const heroVideo = article.videos?.[0];
  const image = seo.ogImageUrl || (heroVideo?.thumbnailUrl ? heroVideo.thumbnailUrl : article.imageUrl);
  const url = `${SITE}/amakuru/${encodeURIComponent(article.slug || article.id)}`;
  return {
    title,
    description,
    alternates: { canonical: seo.canonicalUrl || url },
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    keywords: seo.keywords ?? article.tags,
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
      publishedTime: article.publishedAt,
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(article.authorName ? { authors: [article.authorName] } : {}),
      tags: article.tags,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** NewsArticle + VideoObject structured data (Google/actors love provenance). */
function jsonLd(article: NonNullable<Awaited<ReturnType<typeof getArticle>>['article']>) {
  const nodes: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      ...(article.titleKiny ? { inLanguage: 'rw', alternateHeadline: article.titleKiny } : {}),
      description: article.excerpt,
      datePublished: article.publishedAt,
      ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
      isAccessibleForFree: !article.premium,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/amakuru/${encodeURIComponent(article.slug || article.id)}` },
      ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
      ...(article.authorName ? { author: [{ '@type': 'Person', name: article.authorName }] } : {}),
      publisher: { '@type': 'Organization', name: 'IbiheNews', url: SITE },
      ...(article.sources?.[0] ? { citation: article.sources.map((src) => ({ '@type': 'CreativeWork', name: src.name, url: src.url })) } : {}),
      ...(article.factCheck ? { claimReviewed: article.factCheck.rating } : {}),
      ...(article.videos?.length
        ? {
            video: article.videos
              .filter((v) => isSafeEmbedUrl(v.embedUrl) || v.provider === 'file')
              .map((v) => ({
                '@type': 'VideoObject',
                name: v.title || article.title,
                ...(v.caption ? { description: v.caption } : {}),
                ...(v.thumbnailUrl ? { thumbnailUrl: v.thumbnailUrl } : {}),
                uploadDate: article.publishedAt,
                ...(v.durationSec ? { duration: `PT${Math.round(v.durationSec / 60)}M` } : {}),
                embedUrl: v.embedUrl,
                contentUrl: v.provider === 'file' ? v.embedUrl : undefined,
              })),
          }
        : {}),
    },
  ];
  return nodes;
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { article, related, cluster, dataMode } = await getArticle(id);
  if (!article) notFound();
  const whyItMatters = buildWhyItMatters(article);
  return (
    <main className="min-h-[40vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(article)).replace(/</g, '\\u003c') }}
      />
      <ViewPing id={article.id} />
      <ArticleView article={article} related={related} cluster={cluster} whyItMatters={whyItMatters} dataMode={dataMode} />
    </main>
  );
}
