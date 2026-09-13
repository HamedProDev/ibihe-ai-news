import { listArticles, allArticles } from '@/lib/news/store';
import { searchArticles } from '@/lib/news/search';
import { NewsExplorer } from '@/components/home/NewsExplorer';
import { TrendingStrip } from '@/components/home/TrendingStrip';
import { Sidebar } from '@/components/home/Sidebar';
import { DemoBanner } from '@/components/ui/Badges';
import { SectionTitle } from '@/components/home/SectionTitle';
import type { NewsCategory } from '@/types/news';
import { STRINGS } from '@/lib/i18n/dictionaries';
import { CATEGORY_ALIASES, CATEGORY_SLUGS } from '@/lib/news/category-registry';

export const revalidate = 300;

/** Nav slugs + legacy aliases both resolve; unknown values fall back to all. */
function resolveCategory(rawCat: string | undefined): NewsCategory | 'all' {
  if (!rawCat || rawCat === 'all') return 'all';
  if ((CATEGORY_SLUGS as string[]).includes(rawCat)) return rawCat as NewsCategory;
  return (CATEGORY_ALIASES[rawCat.toLowerCase()] as NewsCategory | undefined) ?? 'all';
}

export default async function AmakuruPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; videos?: string }>;
}) {
  const params = await searchParams;
  const category = resolveCategory(params.category);
  const q = (params.q ?? '').trim();
  // "Videos" in the main nav: the same feed, restricted to stories with video.
  const videos = params.videos === '1' || params.videos === 'true';

  if (q) {
    const { articles, dataMode } = await allArticles();
    const hits = searchArticles(articles, q, 24).map((h) => h.article);
    return (
      <main className="x-container py-6 sm:py-8">
        <DemoBanner mode={dataMode} />
        <h1 className="mb-1 text-xl font-bold text-ink">“{q}”</h1>
        <p className="mb-5 text-sm text-ink/50">{hits.length}</p>
        <NewsExplorer key={q} initial={hits} query={q} limit={24} />
      </main>
    );
  }

  const { articles, dataMode } = await listArticles({
    category,
    limit: 24,
    ...(videos ? { hasVideo: true } : {}),
  });
  const topStories = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);

  return (
    <main className="x-container py-6 sm:py-8">
      <DemoBanner mode={dataMode} />
      <div className="mb-5">
        <SectionTitle entry={videos ? STRINGS.nav.videos : STRINGS.filters.allNews} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewsExplorer key={`${category}-${videos ? 'v' : 'a'}`} initial={articles} initialFilters={{ category }} videosOnly={videos} limit={24} />
        </div>
        <Sidebar topStories={topStories} />
      </div>
      <div className="mt-8">
        <TrendingStrip />
      </div>
    </main>
  );
}
