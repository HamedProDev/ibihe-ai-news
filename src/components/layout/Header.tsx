'use client';
import { useState, useEffect } from 'react';
import { Search, Bell, Menu, X, Brain, Zap } from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Ahabanza', href: '/', key: 'home' },
  { label: 'Ubuhinzi', href: '/category/ubuhinzi', key: 'ubuhinzi' },
  { label: 'Politiki', href: '/category/politiki', key: 'politiki' },
  { label: 'Ubukungu', href: '/category/ubukungu', key: 'ubukungu' },
  { label: 'Ikoranabuhanga', href: '/category/ikoranabuhanga', key: 'tech' },
  { label: 'Amahanga', href: '/category/amahanga', key: 'amahanga' },
];

const TICKER_ITEMS = [
  '🌾 Ibirayi: igiciro kizagwa 5% iki cyumweru',
  '🏛 Amerika: ibiganiro bya diplomasi bigiye gukomeza',
  '💵 USD/RWF: 1$ = 1,342 Fr — riguma ridahinduka',
  '☁️ Imvura: izagwa i Musanze no Rubavu ejo hashize',
  '📈 Ibishyimbo i Nyagatare: hejuru 8% mu byumweru bibiri',
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Main nav */}
      <div className={`bg-[#0a0a0a] border-b border-white/10 transition-all ${scrolled ? 'shadow-lg shadow-black/40' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 bg-[#00c853] rounded-lg flex items-center justify-center">
              <Brain size={16} className="text-black" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Ibihe<span className="text-[#00c853]">AI</span>
            </span>
            <span className="text-[10px] bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 px-1.5 py-0.5 rounded font-medium">NEWS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href}
                className="text-white/60 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg text-sm transition-all">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
              <Search size={18} />
            </button>
            <button className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00c853] rounded-full"></span>
            </button>
            <button className="md:hidden text-white/60 hover:text-white p-2" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* AI Ticker */}
      <div className="bg-[#00c853] h-8 flex items-center gap-3 px-4 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <Zap size={12} className="text-black" fill="black" />
          <span className="text-black text-[11px] font-bold tracking-widest uppercase">AI LIVE</span>
        </div>
        <div className="w-px h-4 bg-black/20" />
        <div className="overflow-hidden flex-1">
          <div key={tickerIdx} className="text-black text-[13px] font-medium animate-slide-in whitespace-nowrap">
            {TICKER_ITEMS[tickerIdx]}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-b border-white/10">
          {NAV_ITEMS.map(item => (
            <Link key={item.key} href={item.href}
              className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 text-sm border-b border-white/5"
              onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
