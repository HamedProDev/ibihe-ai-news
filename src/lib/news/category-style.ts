import type { NewsCategory } from '@/types/news';

/** Category chip colors — solid pills per section (Rwanda-first set). Server-safe. */
const CHIP: Record<NewsCategory, string> = {
  rwanda: 'bg-[#00c853]/90 text-black',
  amahanga: 'bg-sky-500/90 text-white',
  ubukungu: 'bg-blue-500/90 text-white',
  politiki: 'bg-red-500/90 text-white',
  ikoranabuhanga: 'bg-violet-500/90 text-white',
  ubuzima: 'bg-teal-500/90 text-white',
  uburezi: 'bg-amber-500/90 text-black',
  imyidagaduro: 'bg-pink-500/90 text-white',
  imikino: 'bg-orange-500/90 text-white',
  umuco: 'bg-fuchsia-500/90 text-white',
};

export function categoryChip(category: NewsCategory): string {
  return CHIP[category] ?? 'bg-white/15 text-white';
}
