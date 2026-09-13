'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ChipGroup, Empty, ErrorNote, Loading, Panel } from '@/components/admin-control/ui';
import { longDate, timeAgo } from '@/lib/i18n/timeago';

interface Entry {
  id?: number;
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

/** Who changed what, when. */
export default function AdminAuditPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin.auditAdmin;
  const [entity, setEntity] = useState('all');
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: Entry[] }>(`/api/admin/audit?limit=120${entity !== 'all' ? `&entity=${entity}` : ''}`);
      setRows(data.items);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.audit)}</h1>
        <div className="ms-auto">
          <ChipGroup
            ariaLabel={t(A.entity)}
            value={entity as 'all' | 'article' | 'media' | 'comment' | 'settings'}
            onChange={setEntity}
            options={[
              { id: 'all', label: t(s.admin.filters.all) },
              { id: 'article', label: t(s.admin.articles) },
              { id: 'media', label: t(s.admin.mediaLibrary) },
              { id: 'comment', label: t(s.admin.comments) },
              { id: 'settings', label: t(s.admin.settings) },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <Panel title={t(s.admin.audit)}>
          <Empty message={t(A.empty)} />
        </Panel>
      ) : (
        <Panel title={`${rows.length}`}>
          <div className="x-scroll-x -mx-3 sm:-mx-4">
            <table className="x-table min-w-[40rem]">
              <thead>
                <tr>
                  <th>{t(A.actor)}</th>
                  <th>{t(A.actionAdmin)}</th>
                  <th>{t(A.entity)}</th>
                  <th>{t(s.admin.audit)}/details</th>
                  <th className="w-32 text-end">{t(A.when)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id ?? i}>
                    <td className="max-w-[14rem] truncate" dir="ltr">
                      {row.actorEmail || 'system'}
                    </td>
                    <td className="whitespace-nowrap font-medium text-ink/85">{row.action}</td>
                    <td className="text-ink/60">{row.entity}</td>
                    <td className="max-w-[22rem] truncate text-ink/60">
                      {row.entity === 'article' && row.entityId ? (
                        <Link href={`/admin-control/articles/${encodeURIComponent(row.entityId)}`} className="text-brand-ink hover:underline" dir="ltr">
                          {row.entityId}
                        </Link>
                      ) : (
                        <span dir="ltr">{row.entityId}</span>
                      )}
                      {row.summary ? ` — ${row.summary}` : ''}
                    </td>
                    <td className="text-end text-[11px] text-ink/50" title={longDate(row.createdAt, locale)}>
                      {timeAgo(row.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
