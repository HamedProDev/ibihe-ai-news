'use client';

import Link from 'next/link';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function Footer() {
  const { s, locale } = useLocale();
  return (
    <footer className="border-t border-white/10 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-bold text-white/70 mb-1">Ibihe AI News</p>
        <p className="text-white/40 text-[13px] mb-3">
          {locale === 'rw' ? s.footer.tagline.rw : s.footer.tagline.en} — Rwanda 🇷🇼
        </p>
        <p className="text-white/30 text-xs mb-3 max-w-xl mx-auto">
          {locale === 'rw' ? s.footer.sourcesNote.rw : s.footer.sourcesNote.en}
        </p>
        <nav aria-label="Footer" className="flex gap-4 justify-center text-[13px]">
          <Link href="/ibisobanuro" className="text-white/50 hover:text-[#00c853]">
            {locale === 'rw' ? s.footer.method.rw : s.footer.method.en}
          </Link>
          <Link href="/ibimenyetso" className="text-white/50 hover:text-[#00c853]">
            {locale === 'rw' ? s.forecasts.trackRecord.rw : s.forecasts.trackRecord.en}
          </Link>
          <Link href="/baza" className="text-white/50 hover:text-[#00c853]">
            {locale === 'rw' ? s.nav.ask.rw : s.nav.ask.en}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
