'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Newspaper, User, X } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/ui/SearchBar';
import { LanguageSwitcher } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Ticker } from './Ticker';

interface NavItem {
  key: 'home' | 'africa' | 'world' | 'business' | 'politics' | 'technology' | 'health' | 'education' | 'sports' | 'culture' | 'environment';
  href: string;
}

const NAV: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'africa', href: '/amakuru' },
  { key: 'world', href: '/amakuru?category=amahanga' },
  { key: 'business', href: '/amakuru?category=ubukungu' },
  { key: 'politics', href: '/amakuru?category=politiki' },
  { key: 'technology', href: '/amakuru?category=ikoranabuhanga' },
  { key: 'health', href: '/amakuru?category=ubuzima' },
  { key: 'education', href: '/amakuru?category=uburezi' },
  { key: 'sports', href: '/amakuru?category=imikino' },
  { key: 'culture', href: '/amakuru?category=umuco' },
  { key: 'environment', href: '/amakuru?category=ibidukikije' },
];

function AccountButton() {
  const { t, s } = useLocale();
  const { user, loading } = useAuth();
  if (loading) return <span className="size-9 rounded-full bg-white/5 border border-white/10" aria-hidden />;
  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-xl bg-[#00c853] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#00e65f]"
      >
        {t(s.auth.login)}
      </Link>
    );
  }
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  return (
    <Link
      href="/account"
      aria-label={t(s.auth.account)}
      title={user.name || user.email}
      className="flex size-9 items-center justify-center rounded-full border border-[#00c853]/50 bg-[#00c853]/15 text-sm font-bold text-[#00c853] transition-colors hover:bg-[#00c853]/25"
    >
      {initial || <User size={16} aria-hidden />}
    </Link>
  );
}

export default function Header() {
  const { t, s } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      {/* Main bar: logo / search / actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t(s.common.close) : t(s.common.open)}
        >
          {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
        <Link href="/" className="flex shrink-0 items-center gap-2 focus:outline-none" aria-label="IbiheNews — home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#00c853] text-black">
            <Newspaper size={20} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-white">
              Ibihe<span className="text-[#00c853]">News</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-white/40 sm:block">
              {t(s.brand.tagline)}
            </span>
          </span>
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher compact />
          <Link
            href="/account"
            aria-label={t(s.common.notifications)}
            className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:block"
          >
            <Bell size={18} aria-hidden />
          </Link>
          <AccountButton />
        </div>
      </div>
      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>
      {/* Section nav */}
      <nav aria-label={t(s.common.primaryNav)} className="hidden border-t border-white/5 lg:block">
        <ul className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === '/amakuru' && item.href !== '/amakuru'
                  ? false
                  : pathname === '/amakuru' && item.href === '/amakuru';
            return (
              <li key={item.key} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? 'border-[#00c853] text-white'
                      : 'border-transparent text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {t(s.nav[item.key])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Mobile menu */}
      {menuOpen && (
        <nav aria-label={t(s.common.primaryNav)} className="border-t border-white/10 bg-[#0a0a0a] lg:hidden">
          <ul className="max-h-[60vh] overflow-y-auto px-4 py-2">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white"
                >
                  {t(s.nav[item.key])}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Ticker />
    </header>
  );
}
