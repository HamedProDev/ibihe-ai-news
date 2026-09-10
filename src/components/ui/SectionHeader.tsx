'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function SectionHeader({ title, href, icon }: { title: string; href?: string; icon?: React.ReactNode }) {
  const { s, locale } = useLocale();
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-white text-[15px] font-bold">
        {icon}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-[#00c853] text-[13px] font-medium hover:underline"
        >
          {locale === 'rw' ? s.home.viewAll.rw : s.home.viewAll.en}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
