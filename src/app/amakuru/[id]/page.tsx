import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticle } from '@/lib/news/store';
import { buildWhyItMatters } from '@/lib/news/why-matters';
import { ArticleView } from '@/components/news/ArticleView';
import { ViewPing } from '@/components/news/ViewPing';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { article } = await getArticle(id);
  if (!article) return { title: 'Ntibonetse' };
  return {
    title: article.titleKiny,
    description: article.excerptKiny.slice(0, 160),
    openGraph: {
      title: article.titleKiny,
      description: article.excerptKiny.slice(0, 200),
      type: 'article',
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { article, related, cluster, dataMode } = await getArticle(id);
  if (!article) notFound();
  const whyItMatters = buildWhyItMatters(article);
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <ViewPing id={article.id} />
      <ArticleView article={article} related={related} cluster={cluster} whyItMatters={whyItMatters} dataMode={dataMode} />
    </main>
  );
}
