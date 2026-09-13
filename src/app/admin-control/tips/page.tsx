'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ChipGroup, Empty, ErrorNote, Field, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';
import { TimeAgo } from '@/lib/i18n/TimeAgo';

interface TipRow {
  id: string;
  kind: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
  status?: string;
  assignedTo?: string;
  adminNote?: string;
  articleId?: string;
}

/** Reader tips inbox: triage, assign, note, link to a story. */
export default function AdminTipsPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin.tipsAdmin;
  const { toast, show } = useToast();
  const [status, setStatus] = useState<'new' | 'investigating' | 'published' | 'archived' | 'all'>('new');
  const [items, setItems] = useState<TipRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [draft, setDraft] = useState<Record<string, Partial<TipRow>>>({});
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: TipRow[]; counts: Record<string, number> }>(`/api/admin/tips?status=${status}`);
      setItems(data.items);
      setCounts(data.counts ?? {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const save = async (tip: TipRow) => {
    setBusy(tip.id);
    try {
      await adminSend(`/api/admin/tips/${encodeURIComponent(tip.id)}`, 'PUT', draft[tip.id] ?? {});
      show(t(s.admin.saved), 'ok');
      setDraft((prev) => ({ ...prev, [tip.id]: {} }));
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  const val = (tip: TipRow, key: keyof TipRow) => (draft[tip.id]?.[key] as string | undefined) ?? ((tip[key] as string | undefined) ?? '');

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.tips)}</h1>
        <div className="ms-auto">
          <ChipGroup
            ariaLabel={t(s.admin.tips)}
            value={status}
            onChange={setStatus}
            options={[
              { id: 'new', label: `${t(A.statusNew)} ${counts.new ?? ''}`.trim() },
              { id: 'investigating', label: t(A.statusInvestigating) },
              { id: 'published', label: t(A.statusPublished) },
              { id: 'archived', label: t(A.statusArchived) },
              { id: 'all', label: t(s.admin.filters.all) },
            ]}
          />
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <Panel title={t(s.admin.tips)}>
          <Empty message={t(A.empty)} />
        </Panel>
      ) : (
        <ul className="space-y-2">
          {items.map((tip) => (
            <li key={tip.id} className="x-card x-card-pad space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink/50">
                <span className="font-semibold text-ink/80">{tip.name || (locale === 'rw' ? 'Ntizwi' : 'Anonymous')}</span>
                {tip.contact && <span className="truncate" dir="ltr">{tip.contact}</span>}
                <span aria-hidden>·</span>
                <TimeAgo iso={tip.createdAt} locale={locale} />
                <span className="x-chip !py-0">{tip.kind}</span>
              </div>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/85">{tip.message}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label={t(s.admin.state.published) === '' ? '' : 'status'}>
                  <select value={val(tip, 'status') || 'new'} onChange={(e) => setDraft((p) => ({ ...p, [tip.id]: { ...p[tip.id], status: e.target.value } }))} className="x-input">
                    <option value="new">{t(A.statusNew)}</option>
                    <option value="investigating">{t(A.statusInvestigating)}</option>
                    <option value="published">{t(A.statusPublished)}</option>
                    <option value="archived">{t(A.statusArchived)}</option>
                  </select>
                </Field>
                <Field label={t(A.assign)}>
                  <input value={val(tip, 'assignedTo')} onChange={(e) => setDraft((p) => ({ ...p, [tip.id]: { ...p[tip.id], assignedTo: e.target.value } }))} className="x-input" placeholder="desk-verify" />
                </Field>
                <Field label={t(A.linkStory)}>
                  <input value={val(tip, 'articleId')} onChange={(e) => setDraft((p) => ({ ...p, [tip.id]: { ...p[tip.id], articleId: e.target.value } }))} className="x-input" dir="ltr" placeholder="admin-…" />
                </Field>
              </div>
              <Field label={t(A.note)}>
                <input value={val(tip, 'adminNote')} onChange={(e) => setDraft((p) => ({ ...p, [tip.id]: { ...p[tip.id], adminNote: e.target.value } }))} className="x-input" />
              </Field>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void save(tip)} disabled={busy === tip.id} className="x-btn x-btn--primary x-btn--sm">
                  {t(s.common.save)}
                </button>
                {tip.articleId && (
                  <Link href={`/admin-control/articles/${encodeURIComponent(tip.articleId)}`} className="text-[12px] text-brand-ink hover:underline">
                    {t(s.common.edit)}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
