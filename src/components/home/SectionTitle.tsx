'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { LangEntry } from '@/lib/i18n/dictionaries';

export function SectionTitle({ entry }: { entry: LangEntry }) {
  const { t } = useLocale();
  return (
    <h2 className="border-s-4 border-[#00c853] ps-3 text-lg font-bold text-white">
      {t(entry)}
    </h2>
  );
}

export function ViewAllLink({ href }: { href: string }) {
  const { t, s } = useLocale();
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#00c853] hover:underline"
    >
      {t(s.home.viewAll)}
      <ArrowRight size={13} aria-hidden className="rtl:rotate-180" />
    </Link>
  );
}
