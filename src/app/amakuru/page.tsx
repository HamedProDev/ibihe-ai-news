import { listArticles, allArticles } from '@/lib/news/store';
import { searchArticles } from '@/lib/news/search';
import { NewsExplorer } from '@/components/home/NewsExplorer';
import { TrendingStrip } from '@/components/home/TrendingStrip';
import { Sidebar } from '@/components/home/Sidebar';
import { DemoBanner } from '@/components/ui/Badges';
import { SectionTitle } from '@/components/home/SectionTitle';
import type { NewsCategory } from '@/types/news';
import { STRINGS } from '@/lib/i18n/dictionaries';

export const revalidate = 300;

const CATEGORIES: Array<NewsCategory | 'all'> = [
  'all', 'rwanda', 'amahanga', 'ubukungu', 'politiki', 'ikoranabuhanga', 'ubuzima',
  'uburezi', 'imyidagaduro', 'imikino', 'umuco',
];

export default async function AmakuruPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const rawCat = params.category ?? 'all';
  const category = (CATEGORIES as string[]).includes(rawCat) ? (rawCat as NewsCategory | 'all') : 'all';
  const q = (params.q ?? '').trim();

  if (q) {
    const { articles, dataMode } = await allArticles();
    const hits = searchArticles(articles, q, 24).map((h) => h.article);
    return (
      <main className="mx-auto max-w-7xl px-4 py-6">
        <DemoBanner mode={dataMode} />
        <h1 className="mb-1 text-xl font-bold text-white">“{q}”</h1>
        <p className="mb-5 text-sm text-white/50">{hits.length}</p>
        <NewsExplorer key={q} initial={hits} query={q} limit={24} />
      </main>
    );
  }

  const { articles, dataMode } = await listArticles({ category, limit: 24 });
  const topStories = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <DemoBanner mode={dataMode} />
      <div className="mb-5">
        <SectionTitle entry={STRINGS.filters.allNews} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewsExplorer key={category} initial={articles} initialFilters={{ category }} limit={24} />
        </div>
        <Sidebar topStories={topStories} />
      </div>
      <div className="mt-8">
        <TrendingStrip />
      </div>
    </main>
  );
}
