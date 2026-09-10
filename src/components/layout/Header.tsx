'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Brain, Menu, Search, X, Zap } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { SearchBar } from '@/components/ui/SearchBar';
import { useApi } from '@/hooks/useApi';

const NAV = [
  { key: 'home', href: '/' },
  { key: 'news', href: '/amakuru' },
  { key: 'agriculture', href: '/ubuhinzi' },
  { key: 'markets', href: '/isoko' },
  { key: 'weather', href: '/ikirere' },
  { key: 'economy', href: '/ubukungu' },
  { key: 'explainers', href: '/ibisobanuro' },
  { key: 'forecasts', href: '/ibimenyetso' },
] as const;

interface TickerData {
  forecasts: Array<{ questionKiny: string; questionEn: string; probability: number }>;
}

function Ticker() {
  const { locale } = useLocale();
  const { data } = useApi<TickerData>('/api/forecasts?horizon=14d');
  const [idx, setIdx] = useState(0);
  const items = (data?.forecasts ?? [])
    .slice(0, 5)
    .map((f) => `${locale === 'rw' ? f.questionKiny : f.questionEn} — ${f.probability}%`);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  return (
    <div className="bg-[#00c853] min-h-8 flex items-center gap-3 px-4 overflow-hidden" aria-live="polite">
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap size={12} className="text-black" fill="black" aria-hidden="true" />
        <span className="text-black text-[11px] font-bold tracking-widest uppercase">Ibihe</span>
      </div>
      <div className="w-px h-4 bg-black/20 shrink-0" aria-hidden="true" />
      <div className="overflow-hidden flex-1">
        <p key={idx} className="text-black text-[13px] font-medium animate-slide-in truncate">
          {items[idx]}
        </p>
      </div>
    </div>
  );
}

export default function Header() {
  const { s, locale, pick } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional UI reset on navigation
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const navLabel = (key: (typeof NAV)[number]['key']): string =>
    locale === 'rw' ? s.nav[key].rw : s.nav[key].en;

  return (
    <header className="sticky top-0 z-50">
      <div className={`bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 transition-shadow ${scrolled ? 'shadow-lg shadow-black/40' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 min-h-14 flex items-center justify-between gap-3 py-2">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Ibihe AI News — Ahabanza">
            <span className="w-8 h-8 bg-[#00c853] rounded-lg flex items-center justify-center">
              <Brain size={16} className="text-black" aria-hidden="true" />
            </span>
            <span className="text-white font-bold text-lg tracking-tight">
              Ibihe<span className="text-[#00c853]">AI</span>
            </span>
          </Link>

          <nav aria-label={locale === 'rw' ? 'Paji nkuru' : 'Primary'} className="hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-2.5 py-1.5 rounded-lg text-[13px] transition-colors whitespace-nowrap ${
                    active ? 'text-[#00c853] bg-[#00c853]/10 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {navLabel(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="hidden md:block">
              <LanguageToggle compact />
            </div>
            <Link
              href="/baza"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 rounded-lg px-3 py-1.5 hover:bg-[#00c853]/25 transition-colors"
            >
              {pick(s.nav.ask)}
            </Link>
            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-expanded={searchOpen}
              aria-label={locale === 'rw' ? s.search.label.rw : s.search.label.en}
              className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Search size={18} aria-hidden="true" />
            </button>
            <button
              className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00c853] rounded-full" aria-hidden="true" />
            </button>
            <button
              className="lg:hidden text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Funga' : 'Fungura'}
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="max-w-7xl mx-auto px-4 pb-3">
            <SearchBar autoFocus />
          </div>
        )}
      </div>

      <Ticker />

      {menuOpen && (
        <nav aria-label={locale === 'rw' ? 'Paji nkuru' : 'Primary'} className="lg:hidden bg-[#0a0a0a] border-b border-white/10 max-h-[70vh] overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 text-sm border-b border-white/5"
              onClick={() => setMenuOpen(false)}
            >
              {navLabel(item.key)}
            </Link>
          ))}
          <div className="px-4 py-3 flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/baza"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 rounded-lg px-3 py-1.5"
            >
              {pick(s.nav.ask)}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

// Re-export to keep old named imports working if any.
export { Header };
