import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'IbiheNews — Amakuru, Isoko n’Ibimenyetso',
    template: '%s — IbiheNews',
  },
  description:
    'Urubuga rw’amakuru mu Kinyarwanda: inkuru zizewe, ibiciro by’isoko, ikirere n’ubuhinzi, n’ihanura ribonerana. What happened → why it matters → what data says → what could happen next.',
  keywords: ['amakuru', 'Rwanda news', 'Kinyarwanda', 'isoko', 'ibiciro', 'ubuhinzi', 'ikirere', 'forecast'],
  openGraph: {
    title: 'IbiheNews — Rwanda Information Intelligence',
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
    // suppressHydrationWarning: theme is set pre-paint by the inline script below.
    <html lang="rw" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ibihe-theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <LanguageProvider>
          <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#00c853] focus:text-black focus:px-3 focus:py-2 focus:rounded-lg text-sm font-medium"
          >
            Jya ku biraimo
          </a>
          <Header />
          <div id="main-content">{children}</div>
            <Footer />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
