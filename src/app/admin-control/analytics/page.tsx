'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminGet } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ChipGroup, Empty, ErrorNote, Loading, MeterRow, MiniBars, Panel, StatCard } from '@/components/admin-control/ui';
import { timeAgo } from '@/lib/i18n/timeago';

interface Top {
  id: string;
  title: string;
  titleKiny: string;
  category: string;
  views: number;
  videos: number;
  publishedAt: string;
}

interface Data {
  days: number;
  series: Array<{ day: string; views: number; videoPlays: number; searches: number; signups: number; comments: number }>;
  totals: { views: number; videoPlays: number; searches: number; signups: number; comments: number; saves: number };
  top: Top[];
  withVideo: number;
  totalStories: number;
  categories: Array<{ category: string; count: number }>;
}

/** Traffic + engagement, computed from the events table and article counters. */
export default function AdminAnalyticsPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin.analyticsAdmin;
  const [span, setSpan] = useState(14);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminGet<Data>(`/api/admin/analytics?days=${span}`));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [span]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const maxCat = data?.categories?.[0]?.count ?? 1;

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.analytics)}</h1>
        <div className="ms-auto">
          <ChipGroup
            ariaLabel={t(A.range)}
            value={String(span) as '7' | '14' | '30' | '90'}
            onChange={(v) => setSpan(Number(v))}
            options={[
              { id: '7', label: '7d' },
              { id: '14', label: '14d' },
              { id: '30', label: '30d' },
              { id: '90', label: '90d' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : !data ? (
        <Empty message={t(A.noData)} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label={t(A.views)} value={data.totals.views || data.series.reduce((n, d) => n + d.views, 0)} tone="brand" />
            <StatCard label={t(A.videoPlays)} value={data.totals.videoPlays} />
            <StatCard label={t(A.searches)} value={data.totals.searches} />
            <StatCard label={t(A.signups)} value={data.totals.signups} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title={t(A.views)} subtitle={`${data.days}d`} className="lg:col-span-2">
              <MiniBars data={data.series.map((d) => ({ label: d.day, value: d.views }))} label={t(A.views)} />
              <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-ink/45">{t(A.videoPlays)}</p>
                  <MiniBars data={data.series.map((d) => ({ label: d.day, value: d.videoPlays }))} label={t(A.videoPlays)} tone="info" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-ink/45">{t(A.searches)}</p>
                  <MiniBars data={data.series.map((d) => ({ label: d.day, value: d.searches }))} label={t(A.searches)} tone="warn" />
                </div>
              </div>
            </Panel>

            <Panel title={t(A.byCategory)} subtitle={`${data.totalStories} ${t(A.stories)}`}>
              {data.categories.length === 0 ? (
                <Empty message={t(A.noData)} />
              ) : (
                <ul className="space-y-2">
                  {data.categories.map((c) => (
                    <MeterRow key={c.category} label={t((s.categories as Record<string, Parameters<typeof t>[0]>)[c.category] ?? { rw: c.category, en: c.category, fr: c.category, sw: c.category, ar: c.category, ha: c.category })} value={c.count} total={maxCat} />
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title={t(A.topStories)} subtitle={`${data.withVideo} ${t(s.admin.videoCount).toLowerCase()}`}>
            {data.top.length === 0 ? (
              <Empty message={t(A.noData)} />
            ) : (
              <div className="x-scroll-x -mx-3 sm:-mx-4">
                <table className="x-table min-w-[42rem]">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t(s.admin.table.title)}</th>
                      <th className="w-28">{t(s.admin.table.category)}</th>
                      <th className="w-16 text-end">{t(s.admin.table.media)}</th>
                      <th className="w-20 text-end">{t(A.views)}</th>
                      <th className="w-28 text-end">{t(s.admin.table.date)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top.map((row, i) => (
                      <tr key={row.id}>
                        <td className="text-ink/40">{i + 1}</td>
                        <td className="max-w-[26rem]">
                          <Link href={`/admin-control/articles/${encodeURIComponent(row.id)}`} className="block truncate font-medium text-ink hover:text-brand-ink">
                            {locale === 'rw' ? row.titleKiny || row.title : row.title}
                          </Link>
                        </td>
                        <td className="text-[12px] text-ink/60">{row.category}</td>
                        <td className="text-end text-[12px] text-brand-ink">{row.videos || '—'}</td>
                        <td className="text-end text-[12px] tabular-nums">{row.views.toLocaleString()}</td>
                        <td className="text-end text-[11px] text-ink/45">{timeAgo(row.publishedAt, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
