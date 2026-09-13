'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { GalleryImage } from '@/types/news';
import { ArticleImage } from './ArticleImage';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { pickCaption } from '@/lib/news/localize';

/** Contact-sheet of photos; tapping opens a full-width lightbox. */
export function GalleryStrip({ images }: { images: GalleryImage[] }) {
  const { locale, t, s } = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <section aria-label={t(s.article.gallery)} className="mt-6">
      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-ink/60">{t(s.article.gallery)}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((g, i) => (
          <button
            key={g.url + i}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative overflow-hidden rounded-xl border border-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArticleImage src={g.url} alt={g.alt ?? ''} className="aspect-[4/3] w-full" imgClassName="transition-transform group-hover:scale-[1.03]" />
            {pickCaption(g, locale) && (
              <span className="absolute inset-x-0 bottom-0 x-wash px-2 pb-1.5 pt-6 text-start text-[11px] leading-snug text-on-image">
                {pickCaption(g, locale)}
              </span>
            )}
          </button>
        ))}
      </div>

      {open !== null && images[open] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(s.article.gallery)}
          className="fixed inset-0 z-[70] flex flex-col bg-scrim p-3 sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-ink/70">
                {open + 1} / {images.length}
                {images[open].credit ? ` · ${images[open].credit}` : ''}
              </p>
              <button type="button" onClick={() => setOpen(null)} className="x-btn x-btn--ghost x-btn--icon" aria-label={t(s.common.close)}>
                <X size={16} aria-hidden />
              </button>
            </div>
            <ArticleImage src={images[open].url} alt={images[open].alt ?? ''} className="w-full flex-1 rounded-xl bg-black" imgClassName="object-contain" />
            {pickCaption(images[open], locale) && (
              <p className="text-center text-[13px] text-ink/70">{pickCaption(images[open], locale)}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
