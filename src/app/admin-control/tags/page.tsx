'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Field, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';

interface TagRow {
  tag: string;
  count: number;
}

/** Tag cloud: see what readers find, rename or merge a tag across stories. */
export default function AdminTagsPage() {
  const { t, s } = useLocale();
  const A = s.admin.tagsAdmin;
  const { toast, show } = useToast();
  const [rows, setRows] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: TagRow[] }>('/api/admin/tags');
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

  const apply = async (from: string, to: string) => {
    setBusy(true);
    try {
      const data = await adminSend<{ changed: number }>('/api/admin/tags', 'POST', { from, to });
      show(`${data.changed} ${t(s.admin.stories)}`, 'ok');
      setEditing('');
      setNext('');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="x-container space-y-3 py-4">
      <h1 className="x-title-2 text-ink">{t(s.admin.tags)}</h1>
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <Panel title={t(s.admin.tags)}>
          <Empty message={t(s.admin.none)} />
        </Panel>
      ) : (
        <Panel title={`${rows.length} ${t(s.admin.tags).toLowerCase()}`}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.tag} className="rounded-xl border border-line bg-fill p-2.5">
                {editing === r.tag ? (
                  <div className="space-y-2">
                    <Field label={t(A.renameTo)}>
                      <input autoFocus value={next} onChange={(e) => setNext(e.target.value)} className="x-input" dir="ltr" />
                    </Field>
                    <div className="flex gap-1.5">
                      <button type="button" disabled={busy} onClick={() => void apply(r.tag, next.trim().toLowerCase())} className="x-btn x-btn--primary x-btn--sm">
                        {t(s.common.save)}
                      </button>
                      <button type="button" onClick={() => setEditing('')} className="x-btn x-btn--ghost x-btn--sm">
                        {t(s.common.cancel)}
                      </button>
                      <button type="button" disabled={busy} onClick={() => void apply(r.tag, '')} className="x-btn x-btn--danger x-btn--sm ms-auto">
                        {t(s.common.delete)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href={`/amakuru?tag=${encodeURIComponent(r.tag)}`} className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink hover:text-brand-ink" dir="ltr">
                      #{r.tag}
                    </Link>
                    <span className="x-chip !py-0">{r.count}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r.tag);
                        setNext(r.tag);
                      }}
                      className="text-[12px] text-brand-ink hover:underline"
                    >
                      {t(A.rename)}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
