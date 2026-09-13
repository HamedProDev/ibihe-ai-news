'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ArticleEditor } from '@/components/admin-control/ArticleEditor';
import { useLocale } from '@/components/i18n/LanguageProvider';

export default function AdminArticleNewPage() {
  const { t, s } = useLocale();
  return (
    <div className="x-container py-4">
      <Link href="/admin-control/articles" className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-ink/55 hover:text-ink">
        <ArrowLeft size={13} aria-hidden className="rtl:rotate-180" />
        {t(s.admin.backToArticles)}
      </Link>
      <ArticleEditor article={null} />
    </div>
  );
}
