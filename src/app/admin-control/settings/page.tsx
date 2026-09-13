'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ErrorNote, Field, Loading, Panel, Toast, Toggle, useToast } from '@/components/admin-control/ui';

type Settings = Record<string, Record<string, unknown>>;

/** Site-wide switches: identity, appearance, homepage, comments, uploads, AI. */
export default function AdminSettingsPage() {
  const { t, s } = useLocale();
  const A = s.admin.settingsAdmin;
  const { toast, show } = useToast();
  const [v, setV] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ settings: Settings }>('/api/admin/settings');
      setV(data.settings);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const get = <T,>(group: string, key: string, fallback: T): T => {
    const g = v[group];
    if (!g) return fallback;
    const value = g[key];
    return value === undefined || value === null ? fallback : (value as T);
  };
  const set = (group: string, key: string, value: unknown) => {
    setV((prev) => ({ ...prev, [group]: { ...(prev[group] ?? {}), [key]: value } }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await adminSend<{ settings: Settings }>('/api/admin/settings', 'PUT', v);
      setV(data.settings);
      setDirty(false);
      show(t(A.saved), 'ok');
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="x-container py-8"><Loading /></div>;
  if (error) return <div className="x-container py-8"><ErrorNote error={error} onRetry={() => void load()} /></div>;

  const text = (group: string, key: string, label: string, placeholder = '') => (
    <Field label={label}>
      <input value={get(group, key, '') as string} onChange={(e) => set(group, key, e.target.value)} className="x-input" placeholder={placeholder} dir="auto" />
    </Field>
  );
  const num = (group: string, key: string, label: string, min = 0, max = 100000) => (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={get(group, key, 0) as number}
        onChange={(e) => set(group, key, Number(e.target.value))}
        className="x-input"
      />
    </Field>
  );
  const flag = (group: string, key: string, label: string, hint?: string) => (
    <Toggle checked={Boolean(get(group, key, false))} onChange={(x) => set(group, key, x)} label={label} hint={hint} />
  );

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.settings)}</h1>
        {dirty && <span className="x-chip !border-warn/40 !text-warn">{t(s.admin.unsaved)}</span>}
        <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="x-btn x-btn--primary x-btn--sm ms-auto">
          <Save size={13} aria-hidden />
          {t(A.saveSettings)}
        </button>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      <Panel title={t(A.identity)}>
        <div className="grid gap-2 sm:grid-cols-2">
          {text('brand', 'name', 'IbiheNews', s.brand.name.en)}
          {text('brand', 'tagline', s.brand.tagline.en)}
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={2} value={get('brand', 'description', '') as string} onChange={(e) => set('brand', 'description', e.target.value)} className="x-input" />
          </Field>
          {text('brand', 'ogImage', 'Default share image (URL)', 'https://…')}
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={t(A.appearance)}>
          <div className="space-y-2">
            <Field label={t(A.themeDefault)}>
              <select value={get('theme', 'defaultMode', 'dark') as string} onChange={(e) => set('theme', 'defaultMode', e.target.value)} className="x-input">
                <option value="dark">{t(s.theme.dark)}</option>
                <option value="light">{t(s.theme.light)}</option>
                <option value="system">{t(s.theme.system)}</option>
              </select>
            </Field>
            <Field label={t(s.common.language)}>
              <select value={get('locale', 'default', 'rw') as string} onChange={(e) => set('locale', 'default', e.target.value)} className="x-input">
                {['rw', 'en', 'fr', 'sw'].map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t(A.homeSections)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {flag('home', 'showTicker', 'Breaking ticker')}
            {flag('home', 'showHero', 'Lead story hero')}
            {flag('home', 'showTrending', 'Trending strip')}
            {flag('home', 'showSidebar', 'Sidebar')}
            {flag('home', 'showBriefing', 'Daily briefing card')}
            {num('home', 'gridCount', 'Cards on the homepage grid', 3, 40)}
          </div>
        </Panel>

        <Panel title={t(A.tickerAdmin)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {num('ticker', 'maxItems', 'Headlines shown', 1, 20)}
            <Field label="Manual headline (one per line: text | /url)" className="sm:col-span-2">
              <textarea
                rows={3}
                value={(get('ticker', 'manual', []) as Array<{ text: string; url: string }>).map((m) => `${m.text} | ${m.url}`).join('\n')}
                onChange={(e) =>
                  set(
                    'ticker',
                    'manual',
                    e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [textPart, urlPart = ''] = line.split('|');
                        return { text: textPart.trim(), url: urlPart.trim() };
                      }),
                  )
                }
                className="x-input"
              />
            </Field>
          </div>
        </Panel>

        <Panel title={t(A.social)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['twitter', 'facebook', 'youtube', 'whatsapp', 'instagram', 'linkedin'] as const).map((k) => text('social', k, k))}
          </div>
        </Panel>

        <Panel title={t(A.commentsPolicy)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {flag('comments', 'enabled', 'Comments on')}
            {flag('comments', 'autoApprove', 'Auto-approve (skip the queue)')}
            {num('comments', 'maxLength', 'Max characters', 100, 5000)}
            <Field label="Blocked words (comma separated)" className="sm:col-span-2">
              <input
                value={(get('comments', 'blockedWords', []) as string[]).join(', ')}
                onChange={(e) => set('comments', 'blockedWords', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
                className="x-input"
              />
            </Field>
          </div>
        </Panel>

        <Panel title={t(A.uploadsAdmin)}>
          {num('uploads', 'maxKb', 'Max upload size (KB)', 64, 8192)}
        </Panel>

        <Panel title={t(A.aiAdmin)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {flag('ai', 'summariesEnabled', 'AI summaries')}
            {flag('ai', 'briefingEnabled', 'Daily briefing')}
            {num('ai', 'briefingHourUtc', 'Briefing hour (UTC)', 0, 23)}
          </div>
        </Panel>

        <Panel title={t(A.ingestionAdmin)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {flag('ingestion', 'enabled', 'Feed ingestion')}
            {num('ingestion', 'intervalMinutes', 'Minutes between runs', 5, 1440)}
          </div>
        </Panel>

        <Panel title={t(A.maintenance)}>
          <div className="space-y-2">
            {flag('maintenance', 'enabled', t(A.maintenance))}
            {text('maintenance', 'messageKiny', 'Message (RW)')}
            {text('maintenance', 'messageEn', 'Message (EN)')}
          </div>
        </Panel>
      </div>
    </div>
  );
}
