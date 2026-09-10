import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Ibihe AI News — Amakuru n\'Ibyahanuwe',
  description: 'Urubuga rw\'amakuru rugizwe na AI mu Kinyarwanda — inkuru, ibyahanuwe, n\'amasoko',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="rw" className="dark">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <Header />
        {children}
        <footer className="border-t border-white/10 mt-12 py-8 text-center text-white/30 text-sm">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-bold text-white/60 mb-1">Ibihe AI News</p>
            <p>Amakuru n'ibyahanuwe bishingiye ku ikoranabuhanga rya AI — Rwanda 🇷🇼</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
