'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ArticleForm } from '@/components/admin/ArticleForm';

export default function AdminArticleNewPage() {
  const { s, locale } = useLocale();
  const t = (e: { rw: string; en: string }) => (locale === 'rw' ? e.rw : e.en);
  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/articles" className="text-white/60 hover:text-white text-[13px]">
          ← {t(s.admin.backToArticles)}
        </Link>
        <h1 className="text-white text-xl font-bold">{t(s.admin.newArticle)}</h1>
      </div>
      <ArticleForm method="POST" url="/api/admin/articles" />
    </main>
  );
}
