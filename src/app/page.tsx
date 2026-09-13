import { listArticles } from '@/lib/news/store';
import { HeroSection } from '@/components/home/HeroSection';
import { NewsExplorer } from '@/components/home/NewsExplorer';
import { TrendingStrip } from '@/components/home/TrendingStrip';
import { Sidebar } from '@/components/home/Sidebar';
import { DemoBanner } from '@/components/ui/Badges';
import { SectionTitle, ViewAllLink } from '@/components/home/SectionTitle';
import { STRINGS } from '@/lib/i18n/dictionaries';
import { getSiteSettingsRepo } from '@/lib/db/repos/settings';

export const revalidate = 300;

export default async function HomePage() {
  const [{ articles, dataMode }, settings] = await Promise.all([listArticles({ limit: 24 }), getSiteSettingsRepo()]);
  const heroCount = Math.max(1, Math.min(5, settings.home.heroCount));
  const gridCount = Math.max(3, Math.min(30, settings.home.gridCount));
  const lead = articles[0] ?? null;
  const side = articles.slice(1, 1 + Math.max(0, heroCount - 1));
  const grid = articles.slice(heroCount, heroCount + gridCount);
  const topStories = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);

  return (
    <main className="x-container space-y-8 py-5 sm:py-7">
      <DemoBanner mode={dataMode} />

      {settings.home.showHero && <HeroSection lead={lead} side={side} />}

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <section aria-label="News explorer" className="min-w-0 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle entry={STRINGS.filters.allNews} />
            <ViewAllLink href="/amakuru" />
          </div>
          <NewsExplorer initial={grid} limit={gridCount} />
        </section>
        {settings.home.showSidebar && <Sidebar topStories={topStories} />}
      </div>

      {settings.home.showTrending && <TrendingStrip />}
    </main>
  );
}
