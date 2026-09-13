import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { THEME_SCRIPT } from '@/lib/theme/theme';

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
  // Both palettes are declared; the pre-paint script keeps the active one in sync.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5f2' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark light',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: theme + lang/dir are set pre-paint by the script below.
    <html lang="rw" dir="ltr" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <a href="#main-content" className="x-skip">
              Jya ku birimo
            </a>
            <div className="flex min-h-dvh flex-col">
              <Header />
              {/* Pages render their own <main>; this wrapper only anchors the skip link. */}
              <div id="main-content" className="flex-1">
                {children}
              </div>
              <Footer />
            </div>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
