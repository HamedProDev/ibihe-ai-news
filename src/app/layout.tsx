import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';

export const metadata: Metadata = {
  title: {
    default: 'Ibihe AI News — Amakuru, Isoko n’Ibimenyetso',
    template: '%s — Ibihe AI News',
  },
  description:
    'Urubuga rw’amakuru mu Kinyarwanda: inkuru zizewe, ibiciro by’isoko, ikirere n’ubuhinzi, n’ihanura ribonerana. What happened → why it matters → what data says → what could happen next.',
  keywords: ['amakuru', 'Rwanda news', 'Kinyarwanda', 'isoko', 'ibiciro', 'ubuhinzi', 'ikirere', 'forecast'],
  openGraph: {
    title: 'Ibihe AI News — Rwanda Information Intelligence',
    description: 'Amakuru yizewe, ibimenyetso, n’ihanura ribonerana — mu Kinyarwanda.',
    locale: 'rw_RW',
    alternateLocale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="rw" className="dark">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <LanguageProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#00c853] focus:text-black focus:px-3 focus:py-2 focus:rounded-lg text-sm font-medium"
          >
            Jya ku biraimo
          </a>
          <Header />
          <div id="main-content">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
