'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Newspaper, User, X } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/ui/SearchBar';
import { LanguageSwitcher } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Ticker } from './Ticker';

interface NavItem {
  key:
    | 'home'
    | 'rwanda'
    | 'amahanga'
    | 'business'
    | 'politics'
    | 'technology'
    | 'health'
    | 'education'
    | 'entertainment'
    | 'sports'
    | 'culture'
    | 'videos';
  href: string;
}

/** Rwanda-first sections — Home · Rwanda · Amahanga · Business · Politics ·
 *  Technology · Health · Education · Entertainment · Sports · Arts/Culture ·
 *  Videos (a format filter, not a category). */
const NAV: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'rwanda', href: '/amakuru?category=rwanda' },
  { key: 'amahanga', href: '/amakuru?category=amahanga' },
  { key: 'business', href: '/amakuru?category=ubukungu' },
  { key: 'politics', href: '/amakuru?category=politiki' },
  { key: 'technology', href: '/amakuru?category=ikoranabuhanga' },
  { key: 'health', href: '/amakuru?category=ubuzima' },
  { key: 'education', href: '/amakuru?category=uburezi' },
  { key: 'entertainment', href: '/amakuru?category=imyidagaduro' },
  { key: 'sports', href: '/amakuru?category=imikino' },
  { key: 'culture', href: '/amakuru?category=umuco' },
  { key: 'videos', href: '/amakuru?videos=1' },
];

function AccountButton() {
  const { t, s } = useLocale();
  const { user, loading } = useAuth();
  if (loading) return <span className="size-9 shrink-0 rounded-full bg-fill-2 border border-line" aria-hidden />;
  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-xl bg-brand px-3 py-2 text-[13px] font-semibold text-on-brand transition-colors hover:bg-brand-bright sm:px-4 sm:text-sm"
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
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand/50 bg-brand/15 text-sm font-bold text-brand-ink transition-colors hover:bg-brand/25"
    >
      {initial || <User size={16} aria-hidden />}
    </Link>
  );
}

/** Active state for a nav entry — the section pages all live under /amakuru. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/amakuru') return pathname === '/amakuru';
  return false; // category links only light up on their dedicated pages
}

export default function Header() {
  const { t, s } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // A route change always closes the mobile drawer.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on navigation
    setMenuOpen(false);
  }, [pathname]);

  // No page scroll behind the open drawer.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80 x-safe-top">
      {/* Main bar: logo / search / actions */}
      <div className="x-container flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
        <button
          type="button"
          className="-ms-1.5 rounded-lg p-2 text-ink/70 transition-colors hover:bg-fill-2 hover:text-ink lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? t(s.common.close) : t(s.common.open)}
        >
          {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>

        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" aria-label="IbiheNews — home">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-on-brand">
            <Newspaper size={20} aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[17px] font-extrabold tracking-tight text-ink sm:text-lg">
              Ibihe<span className="text-brand-ink">News</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-ink/40 md:block">
              {t(s.brand.tagline)}
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block xl:max-w-xl">
          <SearchBar />
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher compact />
          <AccountButton />
        </div>
      </div>

      {/* Section nav — always reachable: chips scroll on phones, row on desktop */}
      <nav aria-label={t(s.common.primaryNav)} className="border-t border-line">
        <ul className="x-scroll-x flex items-center gap-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-0">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.key} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block border-b-2 px-2.5 py-2 text-[12.5px] font-semibold transition-colors sm:px-3 sm:text-[13px] lg:px-3.5 ${
                    active
                      ? 'border-brand text-ink'
                      : 'border-transparent text-ink/55 hover:border-line-3 hover:text-ink'
                  }`}
                >
                  {t(s.nav[item.key])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Ticker />

      {/* Mobile drawer: search + everything */}
      {menuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-0 z-40 bg-scrim backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label={t(s.common.primaryNav)}
            className="relative z-50 max-h-[78dvh] overflow-y-auto border-t border-line bg-canvas px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="pb-3 md:hidden">
              <SearchBar autoFocus />
            </div>
            <ul className="grid grid-cols-2 gap-1.5">
              {NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="block rounded-xl bg-fill px-3 py-2.5 text-sm font-semibold text-ink/80 transition-colors hover:bg-fill-2 hover:text-ink"
                  >
                    {t(s.nav[item.key])}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3 text-[13px]">
              {[
                { href: '/isoko', label: t(s.nav.markets) },
                { href: '/ikirere', label: t(s.nav.weather) },
                { href: '/ubuhinzi', label: t(s.nav.agriculture) },
                { href: '/ubukungu', label: t(s.nav.economy) },
                { href: '/ibimenyetso', label: t(s.nav.forecasts) },
                { href: '/ibisobanuro', label: t(s.nav.explainers) },
                { href: '/baza', label: t(s.nav.ask) },
                { href: '/briefing', label: t(s.home.briefing) },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 font-medium text-ink/70 transition-colors hover:border-line-3 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
              <LanguageSwitcher />
              <Link
                href="/account"
                className="x-btn x-btn--ghost x-btn--sm"
                aria-label={t(s.auth.account)}
              >
                <User size={14} aria-hidden />
                {t(s.auth.account)}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
