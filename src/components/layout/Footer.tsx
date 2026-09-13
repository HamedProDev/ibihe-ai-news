'use client';

import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { NewsletterForm } from '@/components/home/NewsletterForm';

export function Footer() {
  const { t, s } = useLocale();
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: '/about', label: t(s.footer.about) },
    { href: '/contact', label: t(s.footer.contact) },
    { href: '/advertise', label: t(s.footer.advertise) },
    { href: '/careers', label: t(s.footer.careers) },
    { href: '/help', label: t(s.footer.help) },
  ];

  const sections = [
    { href: '/amakuru?category=rwanda', label: t(s.categories.rwanda) },
    { href: '/amakuru?category=amahanga', label: t(s.categories.amahanga) },
    { href: '/amakuru?category=ubukungu', label: t(s.categories.ubukungu) },
    { href: '/amakuru?category=uburezi', label: t(s.categories.uburezi) },
    { href: '/amakuru?videos=1', label: t(s.nav.videos) },
  ];

  return (
    <footer className="border-t border-ink/10 bg-canvas">
      <div className="x-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-on-brand">
              <Newspaper size={20} aria-hidden />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink">
              Ibihe<span className="text-brand-ink">News</span>
            </span>
          </Link>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/55">{t(s.footer.tagline)}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            {t(s.brand.poweredBy)}
          </p>
        </div>
        <nav aria-label={t(s.footer.quickLinks)}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">{t(s.footer.quickLinks)}</h3>
          <ul className="space-y-2">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-ink/55 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t(s.footer.categoriesTitle)}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">{t(s.footer.categoriesTitle)}</h3>
          <ul className="space-y-2">
            {sections.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-ink/55 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">{t(s.newsletter.title)}</h3>
          <p className="mb-3 text-[13px] text-ink/55">{t(s.newsletter.desc)}</p>
          <NewsletterForm idPrefix="footer-nl" />
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="x-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-ink/40 sm:flex-row">
          <p>© {year} IbiheNews. {t(s.footer.rights)}</p>
          <p className="font-medium text-ink/50">{t(s.footer.slogan)}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">{t(s.footer.privacy)}</Link>
            <Link href="/terms" className="hover:text-ink">{t(s.footer.terms)}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
