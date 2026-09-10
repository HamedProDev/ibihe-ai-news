'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import type { SourceRef } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';

function fmtDate(iso: string | undefined, locale: 'rw' | 'en'): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'rw' ? 'rw-RW' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function EvidenceList({ sources }: { sources: SourceRef[] }) {
  const { s, locale } = useLocale();
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="evidence-h" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5">
      <h2 id="evidence-h" className="flex items-center gap-2 text-white text-[15px] font-bold mb-3">
        <ShieldCheck size={16} className="text-[#00c853]" aria-hidden="true" />
        {locale === 'rw' ? s.article.evidence.rw : s.article.evidence.en}
      </h2>
      <ol className="space-y-3">
        {sources.map((src, i) => (
          <li key={`${src.url}-${i}`} className="flex items-start justify-between gap-3 border-b border-white/5 last:border-0 pb-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-white/85 text-sm font-medium truncate">{src.name}</p>
              <p className="text-white/40 text-xs mt-0.5">
                {locale === 'rw' ? s.article.publishedAt.rw : s.article.publishedAt.en}: {fmtDate(src.publishedAt, locale)}
                {' · '}
                {locale === 'rw' ? s.article.fetchedAt.rw : s.article.fetchedAt.en}: {fmtDate(src.fetchedAt, locale)}
              </p>
            </div>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-[#00c853] text-xs font-medium hover:underline border border-[#00c853]/30 rounded-lg px-2.5 py-1.5"
            >
              {locale === 'rw' ? s.article.readOriginal.rw : s.article.readOriginal.en}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
