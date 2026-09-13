import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { getSessionUser, readSessionToken } from '@/lib/auth/session';
import { updateUserLocaleRepo } from '@/lib/db/repos/users';
import { isLocale } from '@/lib/i18n/dictionaries';

/** PATCH: persist signed-in user's preferred language { locale }. */
export async function PATCH(req: NextRequest) {
  try {
    const info = await getSessionUser(readSessionToken(req));
    if (!info) return err('unauthorized', 'Banji injira.', 'Please log in.', 401);
    const body = (await req.json().catch(() => null)) as { locale?: unknown } | null;
    if (!isLocale(body?.locale)) {
      return err('bad-locale', 'Ururimi ntago ruzwi.', 'Unknown language.', 400);
    }
    const saved = await updateUserLocaleRepo(info.user.id, body.locale);
    if (!saved) return err('save-failed', 'Kubika byanze.', 'Save failed. Please retry.');
    return ok({ locale: body.locale }, 'live');
  } catch (e) {
    console.error('[api/me/locale]', e);
    return err('locale-failed', 'Kubika byanze.', 'Save failed. Please retry.');
  }
}
