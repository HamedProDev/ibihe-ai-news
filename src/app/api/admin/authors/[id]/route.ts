import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { authorSlug, deleteAuthorRepo, getAuthorRepo, upsertAuthorRepo } from '@/lib/db/repos/authors';
import { recordAuditRepo } from '@/lib/db/repos/audit';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const existing = await getAuthorRepo(id);
    if (!existing) return err('not-found', 'Umwanditsi ntibonetse.', 'Author not found.', 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const next = { ...existing };
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    if (name) {
      next.name = name;
      next.slug = authorSlug(name);
    }
    if (typeof body.title === 'string') next.title = body.title.trim().slice(0, 80);
    if (typeof body.bio === 'string') next.bio = body.bio.trim().slice(0, 1200);
    if (typeof body.avatarUrl === 'string') next.avatarUrl = body.avatarUrl.trim().slice(0, 800);
    if (typeof body.email === 'string') next.email = body.email.trim().slice(0, 120);
    if (typeof body.beat === 'string') next.beat = body.beat.trim().slice(0, 30);
    if (typeof body.userId === 'string') next.userId = body.userId.trim().slice(0, 60) || undefined;
    if (body.isActive !== undefined) next.isActive = Boolean(body.isActive);
    if (body.verified !== undefined) next.verified = Boolean(body.verified);
    if (body.social && typeof body.social === 'object') {
      const raw = body.social as Record<string, unknown>;
      next.social = {
        twitter: String(raw.twitter ?? '').slice(0, 120),
        linkedin: String(raw.linkedin ?? '').slice(0, 160),
        whatsapp: String(raw.whatsapp ?? '').slice(0, 40),
      };
    }
    await upsertAuthorRepo(next);
    await recordAuditRepo(g.user, 'author.update', 'author', id, next.name);
    return ok({ author: next }, 'live');
  } catch (e) {
    console.error('[api/admin/authors/[id] PUT]', e);
    return err('author-update-failed', 'Ntibyabitswe.', 'Could not update author.');
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const { id } = await ctx.params;
    const removed = await deleteAuthorRepo(id);
    if (!removed) return err('not-found', 'Umwanditsi ntibonetse.', 'Author not found.', 404);
    await recordAuditRepo(g.user, 'author.delete', 'author', id, 'removed or hidden');
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/authors/[id] DELETE]', e);
    return err('author-delete-failed', 'Ntisibwe.', 'Could not delete author.');
  }
}
