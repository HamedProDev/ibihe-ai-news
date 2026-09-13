'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Save, Trash2 } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Field, Loading, Panel, Toast, Toggle, useToast } from '@/components/admin-control/ui';
import { MediaField } from '@/components/admin-control/MediaField';

interface AuthorRow {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  slug?: string;
  email?: string;
  beat?: string;
  isActive?: boolean;
  verified?: boolean;
  articleCount?: number;
}

/** Newsroom profiles: who writes what, plus their story counts. */
export default function AdminAuthorsPage() {
  const { t, s } = useLocale();
  const A = s.admin.authorsAdmin;
  const { toast, show } = useToast();
  const [rows, setRows] = useState<AuthorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState('');
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<AuthorRow>({ id: '', name: '', title: '', bio: '', avatarUrl: '', email: '', beat: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: AuthorRow[] }>('/api/admin/authors');
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

  const patch = (id: string, p: Partial<AuthorRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const save = async (row: AuthorRow) => {
    setBusy(row.id);
    try {
      if (row.id) await adminSend(`/api/admin/authors/${encodeURIComponent(row.id)}`, 'PUT', row);
      else await adminSend('/api/admin/authors', 'POST', row);
      show(t(s.admin.saved), 'ok');
      setAdding(false);
      setFresh({ id: '', name: '', title: '', bio: '', avatarUrl: '', email: '', beat: '' });
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.authors)}</h1>
        <span className="x-chip">{rows.length}</span>
        <button type="button" onClick={() => setAdding(true)} className="x-btn x-btn--primary x-btn--sm ms-auto">
          <Plus size={13} aria-hidden />
          {t(A.create)}
        </button>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      {adding && (
        <Panel title={t(A.create)}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t(A.name)} required>
              <input value={fresh.name} onChange={(e) => setFresh({ ...fresh, name: e.target.value })} className="x-input" />
            </Field>
            <Field label={t(A.title)}>
              <input value={fresh.title} onChange={(e) => setFresh({ ...fresh, title: e.target.value })} className="x-input" />
            </Field>
            <Field label={t(A.email)}>
              <input value={fresh.email ?? ''} onChange={(e) => setFresh({ ...fresh, email: e.target.value })} className="x-input" dir="ltr" />
            </Field>
            <Field label={t(A.beat)}>
              <input value={fresh.beat ?? ''} onChange={(e) => setFresh({ ...fresh, beat: e.target.value })} className="x-input" />
            </Field>
            <Field label="Bio" className="sm:col-span-2">
              <textarea rows={3} value={fresh.bio} onChange={(e) => setFresh({ ...fresh, bio: e.target.value })} className="x-input" />
            </Field>
            <MediaField label="Avatar" value={fresh.avatarUrl} onChange={(v) => setFresh({ ...fresh, avatarUrl: v })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy === '' || !fresh.name.trim()} onClick={() => void save(fresh)} className="x-btn x-btn--primary x-btn--sm">
              {t(s.common.save)}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="x-btn x-btn--ghost x-btn--sm">
              {t(s.common.cancel)}
            </button>
          </div>
        </Panel>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <Empty message={t(s.admin.none)} />
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {rows.map((row) => (
            <Panel
              key={row.id}
              title={row.name}
              subtitle={`${row.articleCount ?? 0} ${t(s.sidebar.articles)}`}
              actions={
                <>
                  <Link href={`/amakuru?author=${encodeURIComponent(row.id)}`} className="x-btn x-btn--ghost x-btn--sm">
                    {t(s.admin.openStory)}
                  </Link>
                  <button type="button" disabled={busy === row.id} onClick={() => void save(row)} className="x-btn x-btn--primary x-btn--sm">
                    <Save size={12} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => {
                      if (!window.confirm(t(s.admin.deleteConfirm))) return;
                      void adminSend(`/api/admin/authors/${encodeURIComponent(row.id)}`, 'DELETE').then(load);
                    }}
                    className="x-btn x-btn--danger x-btn--sm"
                    aria-label={t(s.common.delete)}
                  >
                    <Trash2 size={12} aria-hidden />
                  </button>
                </>
              }
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label={t(A.name)}>
                  <input value={row.name} onChange={(e) => patch(row.id, { name: e.target.value })} className="x-input" />
                </Field>
                <Field label={t(A.title)}>
                  <input value={row.title} onChange={(e) => patch(row.id, { title: e.target.value })} className="x-input" />
                </Field>
                <Field label={t(A.email)}>
                  <input value={row.email ?? ''} onChange={(e) => patch(row.id, { email: e.target.value })} className="x-input" dir="ltr" />
                </Field>
                <Field label={t(A.beat)}>
                  <input value={row.beat ?? ''} onChange={(e) => patch(row.id, { beat: e.target.value })} className="x-input" />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <textarea rows={2} value={row.bio} onChange={(e) => patch(row.id, { bio: e.target.value })} className="x-input" />
                </Field>
                <MediaField label="Avatar" value={row.avatarUrl} onChange={(v) => patch(row.id, { avatarUrl: v })} />
                <div className="flex flex-wrap items-end gap-4">
                  <Toggle checked={row.isActive !== false} onChange={(v) => patch(row.id, { isActive: v })} label={t(A.active)} />
                  <Toggle checked={row.verified === true} onChange={(v) => patch(row.id, { verified: v })} label="Verified ✓" />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
