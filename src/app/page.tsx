import { listArticles } from '@/lib/news/store';
import { HeroSection } from '@/components/home/HeroSection';
import { NewsExplorer } from '@/components/home/NewsExplorer';
import { TrendingStrip } from '@/components/home/TrendingStrip';
import { Sidebar } from '@/components/home/Sidebar';
import { DemoBanner } from '@/components/ui/Badges';
import { SectionTitle, ViewAllLink } from '@/components/home/SectionTitle';
import { STRINGS } from '@/lib/i18n/dictionaries';

export const revalidate = 300;

export default async function HomePage() {
  const { articles, dataMode } = await listArticles({ limit: 16 });
  const lead = articles[0] ?? null;
  const side = articles.slice(1, 3);
  const grid = articles.slice(3, 15);
  const topStories = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <DemoBanner mode={dataMode} />
      <HeroSection lead={lead} side={side} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section aria-label="News explorer" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle entry={STRINGS.filters.allNews} />
            <ViewAllLink href="/amakuru" />
          </div>
          <NewsExplorer initial={grid} limit={12} />
        </section>
        <Sidebar topStories={topStories} />
      </div>

      <div className="mt-8">
        <TrendingStrip />
      </div>
    </main>
  );
}
