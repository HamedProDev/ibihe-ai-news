'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { EmptyState, LoadingSkeleton } from '@/components/ui/States';

interface BriefingBullet {
  articleId: string;
  textKiny: string;
  textEn: string;
}

interface BriefingData {
  date: string;
  bullets: BriefingBullet[];
  articleCount: number;
  generatedAt: string;
}

/**
 * Full daily AI briefing. Built every morning from the day's real news —
 * bullets are key points from stored articles, never invented.
 */
export default function BriefingPage() {
  const { t, s, locale } = useLocale();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/briefing')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (!alive) return;
        const data = (json as { data?: BriefingData })?.data;
        if (data && Array.isArray(data.bullets)) setBriefing(data);
        else setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#00c853]/15 text-[#00c853]">
          <Bot size={22} aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold text-white">{t(s.sidebar.aiSummary)}</h1>
          <p className="text-[13px] text-white/50">{t(s.sidebar.poweredByEditors)}</p>
        </div>
      </div>

      {!briefing && !failed && <LoadingSkeleton lines={5} label={t(s.states.loading)} />}
      {failed && <EmptyState message={t(s.states.error)} />}
      {briefing && (
        <>
          <ol className="space-y-3">
            {briefing.bullets.map((b, i) => (
              <li key={b.articleId}>
                <Link
                  href={`/amakuru/${b.articleId}`}
                  className="group flex gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 hover:border-white/25"
                >
                  <span
                    aria-hidden
                    className="text-2xl font-extrabold leading-none text-white/10 group-hover:text-[#00c853]/40"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] leading-relaxed text-white/85 group-hover:text-white">
                      {locale === 'rw' ? b.textKiny : b.textEn}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#00c853]">
                      {t(s.home.readStory)}
                      <ArrowRight size={13} aria-hidden className="rtl:rotate-180" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-white/40">
            {briefing.date} • {briefing.articleCount} {t(s.sidebar.articles)}
          </p>
        </>
      )}
    </main>
  );
}
