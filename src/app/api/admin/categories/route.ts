import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin, needStaff } from '@/lib/api/admin-guard';
import { listCategoriesRepo, moveCategoryRepo, upsertCategoryRepo, type CategoryRow } from '@/lib/db/repos/categories';
import { isCategorySlug } from '@/lib/db/repos/categories';
import { listArticlesRepo } from '@/lib/db/repos/articles';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/** Categories with live story counts. */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const rows = await listCategoriesRepo();
    const { items } = await listArticlesRepo({ limit: 500 });
    const counts = new Map<string, number>();
    for (const a of items) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    return ok({ items: rows.map((r) => ({ ...r, count: counts.get(r.slug) ?? 0 })) }, 'live');
  } catch (e) {
    console.error('[api/admin/categories GET]', e);
    return err('categories-failed', 'Ibyiciro ntibibonetse.', 'Could not load categories.');
  }
}

/** Save one category ({ slug, labels, color, icon, description, sortOrder, isActive }). */
export async function PUT(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const slug = String(body?.slug ?? '');
    if (!isCategorySlug(slug)) return err('bad-slug', 'Icyiciro ntikizwi.', 'Unknown category slug.', 400);
    const existing = (await listCategoriesRepo()).find((c) => c.slug === slug);
    const labels = (body?.labels && typeof body.labels === 'object' ? body.labels : existing?.labels ?? {}) as Record<string, string>;
    const clean: CategoryRow = {
      slug,
      labels: Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, String(v).slice(0, 60)])),
      color: /^#[0-9a-fA-F]{6}$/.test(String(body?.color ?? '')) ? String(body!.color) : existing?.color ?? '#00c853',
      icon: String(body?.icon ?? existing?.icon ?? 'newspaper').slice(0, 30),
      description: (body?.description && typeof body.description === 'object' ? body.description : existing?.description ?? {}) as Record<string, string>,
      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Math.floor(Number(body?.sortOrder)) : existing?.sortOrder ?? 0,
      isActive: body?.isActive === undefined ? (existing?.isActive ?? true) : Boolean(body!.isActive),
    };
    await upsertCategoryRepo(clean);
    await recordAuditRepo(g.user, 'category.update', 'category', slug, clean.labels.en || slug);
    return ok({ category: clean }, 'live');
  } catch (e) {
    console.error('[api/admin/categories PUT]', e);
    return err('category-save-failed', 'Icyiciro nticyabitswe.', 'Could not save category.');
  }
}

/** Reorder: { slug, direction: -1 | 1 }. */
export async function POST(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { slug?: unknown; direction?: unknown } | null;
    const slug = String(body?.slug ?? '');
    if (!isCategorySlug(slug)) return err('bad-slug', 'Icyiciro ntikizwi.', 'Unknown category slug.', 400);
    const items = await moveCategoryRepo(slug, Number(body?.direction) === 1 ? 1 : -1);
    return ok({ items }, 'live');
  } catch (e) {
    console.error('[api/admin/categories POST]', e);
    return err('category-move-failed', 'Ntibyashoboka guhindura urutonde.', 'Could not reorder.');
  }
}
