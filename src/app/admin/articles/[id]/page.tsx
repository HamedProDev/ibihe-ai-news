'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Article } from '@/types/news';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { ApiError } from '@/lib/client/api';

export default function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { s, locale } = useLocale();
  const t = (e: { rw: string; en: string }) => (locale === 'rw' ? e.rw : e.en);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`);
        const json = (await res.json()) as {
          ok: boolean;
          data?: { article: Article };
          error?: { code: string; messageKiny: string; messageEn: string };
        };
        if (cancelled) return;
        if (!json.ok || !json.data) {
          setError(new ApiError(json.error?.code ?? 'failed', json.error?.messageKiny ?? '', json.error?.messageEn ?? ''));
        } else {
          setArticle(json.data.article);
        }
      } catch {
        if (!cancelled) setError(new ApiError('network', 'Habaye ikosa.', 'Network error.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/articles" className="text-white/60 hover:text-white text-[13px]">
          ← {t(s.admin.backToArticles)}
        </Link>
        <h1 className="text-white text-xl font-bold">{t(s.admin.editArticle)}</h1>
      </div>
      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        article && <ArticleForm initial={article} method="PUT" url={`/api/admin/articles/${encodeURIComponent(id)}`} />
      )}
    </main>
  );
}
