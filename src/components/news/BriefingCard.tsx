'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import type { DailyBriefing } from '@/lib/news/briefing';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const { s, locale } = useLocale();
  if (briefing.bullets.length === 0) return null;
  return (
    <section aria-labelledby="briefing-h" className="bg-gradient-to-br from-[#00c853]/12 to-transparent border border-[#00c853]/25 rounded-2xl p-4 sm:p-5">
      <h2 id="briefing-h" className="flex items-center gap-2 text-white text-[15px] font-bold mb-3">
        <Newspaper size={16} className="text-[#00c853]" aria-hidden="true" />
        {locale === 'rw' ? s.home.briefing.rw : s.home.briefing.en}
        <span className="ml-auto text-[11px] font-normal text-white/40">
          {briefing.articleCount} · {briefing.date}
        </span>
      </h2>
      <ol className="space-y-2.5">
        {briefing.bullets.map((b) => (
          <li key={b.articleId}>
            <Link href={`/amakuru/${b.articleId}`} className="flex items-start gap-2.5 group">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#00c853] shrink-0" aria-hidden="true" />
              <span className="text-white/80 text-sm leading-relaxed group-hover:text-[#00c853] transition-colors">
                {locale === 'rw' ? b.textKiny : b.textEn}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
