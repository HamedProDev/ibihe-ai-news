'use client';

import { useCallback, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ArticleEditor } from '@/components/admin-control/ArticleEditor';
import { Empty, ErrorNote, Loading } from '@/components/admin-control/ui';
import { adminGet } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { Article } from '@/types/news';

export default function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, s } = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    adminGet<{ article: Article }>(`/api/admin/articles/${encodeURIComponent(id)}`)
      .then((data) => {
        if (alive) setArticle(data.article);
      })
      .catch((e: unknown) => {
        if (alive) setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="x-container py-4">
      <Link href="/admin-control/articles" className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-ink/55 hover:text-ink">
        <ArrowLeft size={13} aria-hidden className="rtl:rotate-180" />
        {t(s.admin.backToArticles)}
      </Link>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={load} />
      ) : article ? (
        <ArticleEditor key={article.id} article={article} />
      ) : (
        <Empty message={t(s.admin.none)} />
      )}
    </div>
  );
}
