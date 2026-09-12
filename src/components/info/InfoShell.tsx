'use client';

import { useLocale } from '@/components/i18n/LanguageProvider';

export function InfoShell({ title, children }: { title: { rw: string; en: string }; children: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-5 border-s-4 border-[#00c853] ps-3 text-2xl font-bold text-white">
        {locale === 'rw' ? title.rw : title.en}
      </h1>
      <div className="space-y-4 text-[15px] leading-relaxed text-white/75">{children}</div>
    </main>
  );
}

export function P({ rw, en }: { rw: string; en: string }) {
  const { locale } = useLocale();
  return <p>{locale === 'rw' ? rw : en}</p>;
}
