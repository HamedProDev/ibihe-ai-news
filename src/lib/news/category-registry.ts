/**
 * Client-safe category registry.
 *
 * The slugs are the contract between the TypeScript union, the routes and the
 * stored rows. Kept free of Node imports so the console (and any client
 * component) can use it without pulling the database layer into the bundle.
 *
 * Rwanda-first sections (nav order): Rwanda · Amahanga · Business · Politics ·
 * Technology · Health · Education · Entertainment · Sports · Arts/Culture.
 * "Home" is a link to /, "Videos" is a format filter (/amakuru?videos=1).
 */
import type { NewsCategory } from '@/types/news';

export const CATEGORY_SLUGS: NewsCategory[] = [
  'rwanda', 'amahanga', 'ubukungu', 'politiki', 'ikoranabuhanga', 'ubuzima',
  'uburezi', 'imyidagaduro', 'imikino', 'umuco',
];

/**
 * Old feed slugs → the section that absorbed them. Stored rows and inbound
 * queries are canonicalised with this map (the DB migration does the same).
 */
export const CATEGORY_ALIASES: Record<string, NewsCategory> = {
  ubuhinzi: 'rwanda',
  ibidukikije: 'rwanda',
  imvurugano: 'rwanda',
  // generic english-ish slugs some feeds use
  politics: 'politiki',
  business: 'ubukungu',
  technology: 'ikoranabuhanga',
  health: 'ubuzima',
  sports: 'imikino',
  culture: 'umuco',
  world: 'amahanga',
  breaking: 'rwanda',
  entertainment: 'imyidagaduro',
  education: 'uburezi',
};

export function canonicalCategory(slug: unknown): NewsCategory {
  if (typeof slug !== 'string' || !slug) return 'rwanda';
  if ((CATEGORY_SLUGS as string[]).includes(slug)) return slug as NewsCategory;
  return CATEGORY_ALIASES[slug.toLowerCase()] ?? 'rwanda';
}

export interface CategoryLabels {
  [locale: string]: string;
}

export interface CategoryMeta {
  slug: NewsCategory;
  labels: CategoryLabels;
  color: string;
  icon: string;
}

/** Display defaults (mirrors the seed rows of migrations 004 + 005). */
export const CATEGORY_META: CategoryMeta[] = [
  { slug: 'rwanda', labels: { rw: 'u Rwanda', en: 'Rwanda', fr: 'Rwanda', sw: 'Rwanda' }, color: '#00c853', icon: 'map-pin' },
  { slug: 'amahanga', labels: { rw: 'Amahanga', en: 'World', fr: 'Monde', sw: 'Dunia' }, color: '#0ea5e9', icon: 'globe' },
  { slug: 'ubukungu', labels: { rw: 'Ubukungu', en: 'Business', fr: 'Affaires', sw: 'Biashara' }, color: '#3b82f6', icon: 'trending-up' },
  { slug: 'politiki', labels: { rw: 'Politiki', en: 'Politics', fr: 'Politique', sw: 'Siasa' }, color: '#ef4444', icon: 'landmark' },
  { slug: 'ikoranabuhanga', labels: { rw: 'Ikoranabuhanga', en: 'Technology', fr: 'Technologie', sw: 'Teknolojia' }, color: '#8b5cf6', icon: 'cpu' },
  { slug: 'ubuzima', labels: { rw: 'Ubuzima', en: 'Health', fr: 'Santé', sw: 'Afya' }, color: '#14b8a6', icon: 'heart-pulse' },
  { slug: 'uburezi', labels: { rw: 'Uburezi', en: 'Education', fr: 'Éducation', sw: 'Elimu' }, color: '#f59e0b', icon: 'graduation-cap' },
  { slug: 'imyidagaduro', labels: { rw: 'Imyidagaduro', en: 'Entertainment', fr: 'Divertissement', sw: 'Burudani' }, color: '#ec4899', icon: 'film' },
  { slug: 'imikino', labels: { rw: 'Imikino', en: 'Sports', fr: 'Sports', sw: 'Michezo' }, color: '#f97316', icon: 'trophy' },
  { slug: 'umuco', labels: { rw: 'Ubugeni n’Umuco', en: 'Arts/Culture', fr: 'Arts/Culture', sw: 'Sanaa' }, color: '#d946ef', icon: 'palette' },
];

export function isCategorySlug(v: unknown): v is NewsCategory {
  return typeof v === 'string' && (CATEGORY_SLUGS as string[]).includes(v);
}
