import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { getBriefingRepo, listBriefingDaysRepo, saveBriefingRepo } from '@/lib/db/repos/briefings';
import { dayKey, ensureDailyBriefing } from '@/lib/briefing/worker';
import { recordAuditRepo } from '@/lib/db/repos/audit';

/** Today's briefing + recent days (console). */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const day = (sp.get('day') ?? dayKey()).slice(0, 10);
    const [briefing, days] = await Promise.all([getBriefingRepo(day), listBriefingDaysRepo(30)]);
    return ok({ day, briefing, days }, 'live');
  } catch (e) {
    console.error('[api/admin/briefing GET]', e);
    return err('briefing-failed', 'Incamake ntibonetse.', 'Could not load the briefing.');
  }
}

/** Rebuild from today's news: { day? } — same builder the cron uses. */
export async function POST(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { day?: unknown } | null;
    const day = String(body?.day ?? dayKey()).slice(0, 10);
    const { briefing } = await ensureDailyBriefing(day);
    await recordAuditRepo(g.user, 'briefing.generate', 'briefing', day, `${briefing.bullets.length} bullets`);
    return ok({ day, briefing }, 'live');
  } catch (e) {
    console.error('[api/admin/briefing POST]', e);
    return err('briefing-build-failed', 'Incamake ntibyubatswe.', 'Could not build the briefing.');
  }
}

/** Hand-edit the stored document: { day, briefing }. */
export async function PUT(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const body = (await req.json().catch(() => null)) as { day?: unknown; briefing?: unknown } | null;
    const day = String(body?.day ?? dayKey()).slice(0, 10);
    const briefing = body?.briefing;
    if (!briefing || typeof briefing !== 'object') return err('bad-request', 'briefing irakenewe.', 'briefing object is required.', 400);
    const doc = briefing as Record<string, unknown>;
    if (!Array.isArray(doc.bullets)) return err('bad-briefing', 'bullets zikenewe.', 'briefing.bullets must be an array.', 400);
    const bullets = (doc.bullets as unknown[])
      .slice(0, 12)
      .map((raw) => {
        const b = (raw ?? {}) as Record<string, unknown>;
        return {
          articleId: String(b.articleId ?? '').slice(0, 80),
          textKiny: String(b.textKiny ?? '').slice(0, 500),
          textEn: String(b.textEn ?? '').slice(0, 500),
        };
      })
      .filter((b) => b.articleId);
    await saveBriefingRepo(day, { ...doc, bullets, editedBy: g.user?.email ?? 'staff', editedAt: new Date().toISOString() });
    await recordAuditRepo(g.user, 'briefing.edit', 'briefing', day, `${bullets.length} bullets`);
    return ok({ day, bullets }, 'live');
  } catch (e) {
    console.error('[api/admin/briefing PUT]', e);
    return err('briefing-save-failed', 'Incamake ntizabitswe.', 'Could not save the briefing.');
  }
}
