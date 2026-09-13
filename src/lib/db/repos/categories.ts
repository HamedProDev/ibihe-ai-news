/**
 * Categories as data (the console can rename, recolour, reorder, hide).
 * The slug contract lives in `src/lib/news/category-registry.ts` (client-safe),
 * so a category can be re-labelled but never invented — routes stay stable.
 */
import type { NewsCategory } from '@/types/news';
import { pgQuery } from '../postgres.ts';
import { CATEGORY_META, CATEGORY_SLUGS, isCategorySlug, type CategoryMeta } from '../../news/category-registry.ts';
import { pgOrJson, readRows, writeRows } from './backend.ts';

export { CATEGORY_SLUGS, isCategorySlug };

export interface CategoryRow {
  slug: NewsCategory;
  /** 6-language display names. */
  labels: Record<string, string>;
  color: string;
  icon: string;
  description: Record<string, string>;
  sortOrder: number;
  isActive: boolean;
}

/** Mirrors the seed rows of migration 004 (single source: the registry). */
export const SEED_CATEGORIES: CategoryRow[] = CATEGORY_META.map((m: CategoryMeta, i: number) => ({
  slug: m.slug,
  labels: m.labels,
  color: m.color,
  icon: m.icon,
  description: {},
  sortOrder: i + 1,
  isActive: true,
}));

const STORE = 'categories';

function rowToCategory(r: {
  slug: string;
  labels: Record<string, string>;
  color: string;
  icon: string;
  description: Record<string, string> | null;
  sort_order: number;
  is_active: boolean;
}): CategoryRow {
  return {
    slug: r.slug as NewsCategory,
    labels: r.labels && Object.keys(r.labels).length ? r.labels : {},
    color: r.color,
    icon: r.icon,
    description: r.description ?? {},
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
  };
}

export async function listCategoriesRepo(): Promise<CategoryRow[]> {
  return pgOrJson('categories list', async () => {
    const r = await pgQuery<{
      slug: string;
      labels: Record<string, string>;
      color: string;
      icon: string;
      description: Record<string, string> | null;
      sort_order: number;
      is_active: boolean;
    }>('SELECT slug, labels, color, icon, description, sort_order, is_active FROM categories ORDER BY sort_order ASC, slug ASC');
    if (r.rows.length === 0) return SEED_CATEGORIES;
    // Seed any category the DB does not know yet (the union is the contract).
    const seen = new Set(r.rows.map((x) => x.slug));
    const extra = SEED_CATEGORIES.filter((s) => !seen.has(s.slug));
    return [...r.rows.map(rowToCategory), ...extra].sort((a, b) => a.sortOrder - b.sortOrder);
  }, async () => {
    const stored = await readRows<CategoryRow>(STORE);
    return stored.length ? [...stored].sort((a, b) => a.sortOrder - b.sortOrder) : SEED_CATEGORIES;
  });
}

export async function upsertCategoryRepo(row: CategoryRow): Promise<void> {
  await pgOrJson('categories upsert', async () => {
    await pgQuery(
      `INSERT INTO categories (slug, labels, color, icon, description, sort_order, is_active, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now())
       ON CONFLICT (slug) DO UPDATE SET labels = EXCLUDED.labels, color = EXCLUDED.color,
         icon = EXCLUDED.icon, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
         is_active = EXCLUDED.is_active, updated_at = now()`,
      [row.slug, JSON.stringify(row.labels), row.color, row.icon, JSON.stringify(row.description), row.sortOrder, row.isActive],
    );
  }, async () => {
    const all = await readRows<CategoryRow>(STORE);
    const next = all.length ? all : SEED_CATEGORIES;
    await writeRows(STORE, [...next.filter((c) => c.slug !== row.slug), row].sort((a, b) => a.sortOrder - b.sortOrder));
  });
}

/** Only display metadata can be deleted — the slug stays routable. */
export async function resetCategoryRepo(slug: NewsCategory): Promise<void> {
  await pgOrJson('categories reset', async () => {
    await pgQuery('DELETE FROM categories WHERE slug = $1', [slug]);
  }, async () => {
    const all = await readRows<CategoryRow>(STORE);
    await writeRows(STORE, all.filter((c) => c.slug !== slug));
  });
}

export async function moveCategoryRepo(slug: NewsCategory, direction: -1 | 1): Promise<CategoryRow[]> {
  const all = await listCategoriesRepo();
  const idx = all.findIndex((c) => c.slug === slug);
  const swap = idx + direction;
  if (idx < 0 || swap < 0 || swap >= all.length) return all;
  const next = [...all];
  [next[idx], next[swap]] = [next[swap]!, next[idx]!];
  const reordered = next.map((c, i) => ({ ...c, sortOrder: i + 1 }));
  for (const c of reordered) await upsertCategoryRepo(c);
  return reordered;
}
