import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needAdmin } from '@/lib/api/admin-guard';
import { getSiteSettingsRepo, saveSiteSettingsRepo } from '@/lib/db/repos/settings';
import { dbBackend } from '@/lib/db/postgres';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/** Full settings document (admin only — includes internal toggles). */
export async function GET(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const settings = await getSiteSettingsRepo();
    return ok({ settings, backend: dbBackend() }, 'live');
  } catch (e) {
    console.error('[api/admin/settings GET]', e);
    return err('settings-failed', 'Igenamiterere ntibibonetse.', 'Could not load settings.');
  }
}

/** Merge a partial settings document into the stored one. */
export async function PUT(req: NextRequest) {
  const g = await needAdmin(req);
  if (g.res) return g.res;
  try {
    const patch = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!patch || typeof patch !== 'object') return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const settings = await saveSiteSettingsRepo(patch, g.user?.email ?? 'admin');
    await recordAuditRepo(g.user, 'settings.update', 'settings', 'site', Object.keys(patch).join(','));
    return ok({ settings }, 'live');
  } catch (e) {
    console.error('[api/admin/settings PUT]', e);
    return err('settings-save-failed', 'Igenamiterere ntiyabitswe.', 'Could not save settings.');
  }
}
