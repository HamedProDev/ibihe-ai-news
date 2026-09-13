/**
 * Site settings — one JSONB document, merged over defaults on every read so
 * new keys never need a migration. Public parts are exposed to the client;
 * `internal` bits (moderation, AI toggles) stay server-side.
 */
import { pgQuery } from '../postgres.ts';
import { pgOrJson, readStore, writeStore } from './backend.ts';

export interface SiteSettings {
  brand: { name: string; tagline: string; description: string; ogImage: string };
  theme: { defaultMode: 'dark' | 'light' | 'system' };
  locale: { default: string; enabled: string[] };
  home: {
    showTicker: boolean;
    showHero: boolean;
    showTrending: boolean;
    showSidebar: boolean;
    showBriefing: boolean;
    heroCount: number;
    gridCount: number;
    articlesPerPage: number;
  };
  ticker: { maxItems: number; manual: Array<{ text: string; url: string }> };
  social: { twitter: string; facebook: string; youtube: string; whatsapp: string; instagram: string; linkedin: string };
  seo: { titleSuffix: string; description: string; twitterHandle: string };
  comments: { enabled: boolean; autoApprove: boolean; maxLength: number; blockedWords: string[] };
  uploads: { maxKb: number };
  ai: { summariesEnabled: boolean; briefingEnabled: boolean; briefingHourUtc: number; modelLabel: string };
  ingestion: { enabled: boolean; intervalMinutes: number };
  newsletter: { welcomeMessage: string };
  maintenance: { enabled: boolean; messageKiny: string; messageEn: string };
  moderation: { reviewEditorial: boolean };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: 'IbiheNews',
    tagline: 'African News & Intelligence',
    description: 'Amakuru yizewe, ibimenyetso, n’ihanura ribonerana — mu Kinyarwanda.',
    ogImage: '',
  },
  theme: { defaultMode: 'dark' },
  locale: { default: 'rw', enabled: ['rw', 'en', 'fr', 'sw'] },
  home: {
    showTicker: true,
    showHero: true,
    showTrending: true,
    showSidebar: true,
    showBriefing: true,
    heroCount: 3,
    gridCount: 12,
    articlesPerPage: 12,
  },
  ticker: { maxItems: 8, manual: [] },
  social: { twitter: '', facebook: '', youtube: '', whatsapp: '', instagram: '', linkedin: '' },
  seo: { titleSuffix: 'IbiheNews', description: '', twitterHandle: '' },
  comments: { enabled: true, autoApprove: false, maxLength: 1200, blockedWords: [] },
  uploads: { maxKb: 2048 },
  ai: { summariesEnabled: true, briefingEnabled: true, briefingHourUtc: 5, modelLabel: 'claude + extractive' },
  ingestion: { enabled: true, intervalMinutes: 30 },
  newsletter: { welcomeMessage: 'Murakoze kwiyandikisha ku IbiheNews.' },
  maintenance: { enabled: false, messageKiny: 'Urubuga ruravugururwa. Tegereza gato.', messageEn: 'We are updating the site. Please come back shortly.' },
  moderation: { reviewEditorial: false },
};

const STORE = 'site-settings';

function merge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const current = out[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && current && typeof current === 'object' && !Array.isArray(current)) {
      out[k] = merge(current, v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export async function getSiteSettingsRepo(): Promise<SiteSettings> {
  const stored = await pgOrJson('settings get', async () => {
    const r = await pgQuery<{ data: SiteSettings }>('SELECT data FROM site_settings WHERE key = $1', ['site']);
    return r.rows[0]?.data ?? null;
  }, async () => (await readStore<SiteSettings>(STORE))?.value ?? null);
  return merge(DEFAULT_SETTINGS, stored);
}

/** Shallow-safe public subset (what the site + clients may read). */
export function publicSettings(s: SiteSettings): SiteSettings {
  return {
    ...s,
    uploads: { maxKb: s.uploads.maxKb },
    ai: { ...s.ai, modelLabel: '' },
    moderation: { reviewEditorial: false },
  };
}

export async function saveSiteSettingsRepo(patch: unknown, actor = ''): Promise<SiteSettings> {
  const next = merge(await getSiteSettingsRepo(), patch);
  await pgOrJson('settings save', async () => {
    await pgQuery(
      `INSERT INTO site_settings (key, data, updated_by, updated_at) VALUES ($1,$2,$3,now())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      ['site', JSON.stringify(next), actor],
    );
  }, async () => {
    await writeStore(STORE, next);
  });
  return next;
}
