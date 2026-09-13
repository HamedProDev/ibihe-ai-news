'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ErrorNote, Field, Loading, Panel, Toast, Toggle, useToast } from '@/components/admin-control/ui';

interface Row {
  slug: string;
  labels: Record<string, string>;
  description: Record<string, string>;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  count: number;
}

const LOCALES = ['rw', 'en', 'fr', 'sw'] as const;

/** Rename / recolour / reorder the sections of the site. */
export default function AdminCategoriesPage() {
  const { t, s } = useLocale();
  const A = s.admin.categoriesAdmin;
  const { toast, show } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: Row[] }>('/api/admin/categories');
      setRows(data.items);
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

  const patch = (slug: string, p: Partial<Row>) => setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...p } : r)));

  const save = async (row: Row) => {
    setBusy(row.slug);
    try {
      await adminSend('/api/admin/categories', 'PUT', row);
      show(`${row.slug} — ${t(s.admin.settingsAdmin.saved)}`, 'ok');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  const move = async (slug: string, direction: -1 | 1) => {
    setBusy(slug);
    try {
      const data = await adminSend<{ items: Row[] }>('/api/admin/categories', 'POST', { slug, direction });
      setRows(data.items);
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="x-container space-y-3 py-4">
      <h1 className="x-title-2 text-ink">{t(s.admin.categories)}</h1>
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <Panel key={row.slug} title={`${i + 1}. ${row.slug}`} subtitle={`${row.count} ${t(s.sidebar.articles)}`}
              actions={
                <>
                  <button type="button" onClick={() => void move(row.slug, -1)} disabled={i === 0 || busy === row.slug} className="x-btn x-btn--ghost x-btn--sm" aria-label={t(A.moveUp)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => void move(row.slug, 1)} disabled={i === rows.length - 1 || busy === row.slug} className="x-btn x-btn--ghost x-btn--sm" aria-label={t(A.moveDown)}>
                    ↓
                  </button>
                  <button type="button" onClick={() => void save(row)} disabled={busy === row.slug} className="x-btn x-btn--primary x-btn--sm">
                    <Save size={13} aria-hidden />
                    {t(s.common.save)}
                  </button>
                </>
              }
            >
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {LOCALES.map((code) => (
                  <Field key={code} label={code.toUpperCase()}>
                    <input
                      value={row.labels[code] ?? ''}
                      onChange={(e) => patch(row.slug, { labels: { ...row.labels, [code]: e.target.value } })}
                      className="x-input"
                                          />
                  </Field>
                ))}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <Field label={t(A.color)}>
                  <div className="flex items-center gap-2">
                    <input type="color" value={row.color} onChange={(e) => patch(row.slug, { color: e.target.value })} className="h-9 w-10 shrink-0 rounded border border-line bg-transparent" aria-label={t(A.color)} />
                    <input value={row.color} onChange={(e) => patch(row.slug, { color: e.target.value })} className="x-input font-mono !text-[12px]" dir="ltr" />
                  </div>
                </Field>
                <Field label={t(A.icon)}>
                  <input value={row.icon} onChange={(e) => patch(row.slug, { icon: e.target.value })} className="x-input" dir="ltr" />
                </Field>
                <Field label={t(A.description)}>
                  <input value={row.description.rw ?? ''} onChange={(e) => patch(row.slug, { description: { ...row.description, rw: e.target.value } })} className="x-input" />
                </Field>
                <div className="flex items-end">
                  <Toggle checked={row.isActive} onChange={(v) => patch(row.slug, { isActive: v })} label={t(A.active)} />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
