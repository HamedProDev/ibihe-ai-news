'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { adminGet } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Loading, MeterRow, Panel, StatCard } from '@/components/admin-control/ui';

interface Sub {
  email: string;
  locale: string;
  createdAt: string;
}

/** Newsletter list + CSV export (no email provider wired yet). */
export default function AdminNewsletterPage() {
  const { t, s } = useLocale();
  const A = s.admin.newsletterAdmin;
  const [items, setItems] = useState<Sub[]>([]);
  const [byLocale, setByLocale] = useState<Array<{ locale: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: Sub[]; total: number; byLocale: Array<{ locale: string; count: number }> }>('/api/admin/subscribers?limit=1000');
      setItems(data.items);
      setByLocale(data.byLocale ?? []);
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

  const total = items.length;

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.newsletter)}</h1>
        <a href="/api/admin/subscribers?format=csv" className="x-btn x-btn--ghost x-btn--sm ms-auto">
          <Download size={13} aria-hidden />
          {t(A.export)}
        </a>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label={t(A.total)} value={total} tone="brand" />
            {byLocale.slice(0, 3).map((l) => (
              <StatCard key={l.locale} label={l.locale.toUpperCase()} value={l.count} />
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title={t(s.article.details)} className="lg:col-span-2">
              {items.length === 0 ? (
                <Empty message={t(s.admin.none)} />
              ) : (
                <div className="x-scroll-x -mx-3 sm:-mx-4">
                  <table className="x-table min-w-[26rem]">
                    <thead>
                      <tr>
                        <th>{t(s.auth?.email ?? s.form.title)}</th>
                        <th className="w-24">{t(A.locale)}</th>
                        <th className="w-32 text-end">{t(A.joined)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 300).map((sub) => (
                        <tr key={sub.email}>
                          <td className="truncate" dir="ltr">{sub.email}</td>
                          <td>{sub.locale?.toUpperCase?.() ?? sub.locale}</td>
                          <td className="text-end text-[12px] text-ink/55">{sub.createdAt.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
            <Panel title={t(s.common.language)}>
              <ul className="space-y-2">
                {byLocale.map((l) => (
                  <MeterRow key={l.locale} label={l.locale.toUpperCase()} value={l.count} total={total || 1} />
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
