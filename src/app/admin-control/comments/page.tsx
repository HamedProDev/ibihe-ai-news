'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, Check, EyeOff, Trash2 } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ChipGroup, Empty, ErrorNote, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';
import { TimeAgo } from '@/lib/i18n/TimeAgo';
import type { Comment } from '@/types/comments';

type Filter = 'pending' | 'approved' | 'hidden' | 'spam' | 'all';

/** Reader-comment moderation: approve, hide, mark spam, delete. */
export default function AdminCommentsPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin.commentsAdmin;
  const { toast, show } = useToast();
  const [filter, setFilter] = useState<Filter>('pending');
  const [items, setItems] = useState<Comment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: Comment[]; counts: Record<string, number> }>(`/api/admin/comments?status=${filter}`);
      setItems(data.items);
      setCounts(data.counts ?? {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const decide = async (id: string, status: string) => {
    setBusy(id + status);
    try {
      await adminSend('/api/admin/comments', 'PATCH', { id, status });
      show(t(A.moderated), 'ok');
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
        <h1 className="x-title-2 text-ink">{t(s.admin.comments)}</h1>
        {counts.pending ? <span className="x-chip !border-danger/40 !text-danger">{counts.pending}</span> : null}
        <div className="ms-auto">
          <ChipGroup
            ariaLabel={t(s.admin.comments)}
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'pending', label: `${t(A.queued)} ${counts.pending ?? ''}`.trim() },
              { id: 'approved', label: t(A.approved) },
              { id: 'hidden', label: t(A.hidden) },
              { id: 'spam', label: t(A.spam) },
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
        <Panel title={t(s.admin.comments)}>
          <Empty message={t(A.empty)} />
        </Panel>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="x-card x-card-pad">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink/50">
                <span className="font-semibold text-ink/80">{c.authorName || '—'}</span>
                {c.authorEmail && <span className="truncate">{c.authorEmail}</span>}
                <span aria-hidden>·</span>
                <TimeAgo iso={c.createdAt} locale={locale} />
                {c.language && <span className="x-chip !py-0 !text-[10px]">{c.language.toUpperCase()}</span>}
                <Link href={`/admin-control/articles/${encodeURIComponent(c.articleId)}`} className="ms-auto truncate text-brand-ink hover:underline">
                  {t(A.onStory)} →
                </Link>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink/85">{c.body}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.status !== 'approved' && (
                  <button type="button" disabled={busy === c.id + 'approved'} onClick={() => void decide(c.id, 'approved')} className="x-btn x-btn--primary x-btn--sm">
                    <Check size={13} aria-hidden />
                    {t(A.approve)}
                  </button>
                )}
                {c.status !== 'hidden' && (
                  <button type="button" disabled={busy === c.id + 'hidden'} onClick={() => void decide(c.id, 'hidden')} className="x-btn x-btn--ghost x-btn--sm">
                    <EyeOff size={13} aria-hidden />
                    {t(A.hide)}
                  </button>
                )}
                {c.status !== 'spam' && (
                  <button type="button" disabled={busy === c.id + 'spam'} onClick={() => void decide(c.id, 'spam')} className="x-btn x-btn--ghost x-btn--sm">
                    <Ban size={13} aria-hidden />
                    {t(A.markSpam)}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === c.id + 'delete'}
                  onClick={() => {
                    if (!window.confirm(t(s.admin.deleteConfirm))) return;
                    void adminSend(`/api/admin/comments?id=${encodeURIComponent(c.id)}`, 'DELETE').then(load);
                  }}
                  className="x-btn x-btn--danger x-btn--sm ms-auto"
                >
                  <Trash2 size={13} aria-hidden />
                  {t(s.common.delete)}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
