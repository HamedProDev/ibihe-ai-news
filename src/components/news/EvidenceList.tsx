'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import type { SourceRef } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { Locale } from '@/lib/i18n/dictionaries';

function fmtDate(iso: string | undefined, locale: Locale): string {
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
  const { t, s, locale } = useLocale();
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="evidence-h" className="bg-ink/[0.03] border border-ink/10 rounded-2xl p-4 sm:p-5">
      <h2 id="evidence-h" className="flex items-center gap-2 text-ink text-[15px] font-bold mb-3">
        <ShieldCheck size={16} className="text-brand-ink" aria-hidden="true" />
        {t(s.article.evidence)}
      </h2>
      <ol className="space-y-3">
        {sources.map((src, i) => (
          <li key={`${src.url}-${i}`} className="flex items-start justify-between gap-3 border-b border-ink/5 last:border-0 pb-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-ink/85 text-sm font-medium truncate">{src.name}</p>
              <p className="text-ink/40 text-xs mt-0.5">
                {t(s.article.publishedAt)}: {fmtDate(src.publishedAt, locale)}
                {' · '}
                {t(s.article.fetchedAt)}: {fmtDate(src.fetchedAt, locale)}
              </p>
            </div>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-brand-ink text-xs font-medium hover:underline border border-brand/30 rounded-lg px-2.5 py-1.5"
            >
              {t(s.article.readOriginal)}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
