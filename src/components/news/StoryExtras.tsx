'use client';

import { Download, FileText, Headphones } from 'lucide-react';
import type { Attachment } from '@/types/news';
import { useLocale } from '@/components/i18n/LanguageProvider';

/** Documents the newsroom attached (statements, datasets, PDFs). */
export function Attachments({ items }: { items: Attachment[] }) {
  const { t, s } = useLocale();
  if (items.length === 0) return null;
  return (
    <section aria-label={t(s.article.attachments)} className="x-card x-card-pad mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink/60">
        <FileText size={14} className="text-brand-ink" aria-hidden />
        {t(s.article.attachments)}
      </h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id}>
            <a
              href={a.url}
              target={a.url.startsWith('/') ? undefined : '_blank'}
              rel="noopener noreferrer"
              download
              className="flex items-center gap-3 rounded-xl bg-fill px-3 py-2.5 text-sm text-ink/80 transition-colors hover:bg-fill-2 hover:text-ink"
            >
              <FileText size={15} className="shrink-0 text-ink/45" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              {a.mime && <span className="hidden text-[11px] uppercase text-ink/40 sm:inline">{a.mime.split('/').pop()}</span>}
              {typeof a.sizeKb === 'number' && a.sizeKb > 0 && <span className="text-[11px] text-ink/40">{a.sizeKb < 1024 ? `${a.sizeKb} KB` : `${(a.sizeKb / 1024).toFixed(1)} MB`}</span>}
              <Download size={14} className="shrink-0 text-ink/40" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Audio narration for readers who prefer listening. */
export function AudioNarration({ src }: { src: string }) {
  const { t, s } = useLocale();
  return (
    <section aria-label={t(s.common.language)} className="x-card x-card-pad mt-6 flex flex-wrap items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-ink">
        <Headphones size={17} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-[13px] font-semibold text-ink">Écouter cet article</p>
        <audio src={src} controls className="mt-2 w-full" preload="none" />
      </div>
    </section>
  );
}
