import { ok, err } from '@/lib/api/envelope';
import { getSiteSettingsRepo, publicSettings } from '@/lib/db/repos/settings';

/** Public site configuration (theme default, homepage switches, socials…). */
export async function GET() {
  try {
    const settings = await getSiteSettingsRepo();
    return ok({ settings: publicSettings(settings) }, 'live');
  } catch (e) {
    console.error('[api/settings]', e);
    return err('settings-failed', 'Igenamiterere ntibibonetse.', 'Could not load settings.');
  }
}
