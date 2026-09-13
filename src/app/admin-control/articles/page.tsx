'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Filter, Play, Plus, Search, Star, Trash2 } from 'lucide-react';
import type { Article } from '@/types/news';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { CATEGORY_SLUGS } from '@/lib/news/category-registry';
import { Empty, ErrorNote, Field, Loading, Pager, Panel, StateDot, Toast, useToast } from '@/components/admin-control/ui';
import { TimeAgo } from '@/lib/i18n/TimeAgo';

const PAGE_SIZE = 25;

/** Category label in the UI language (the dict is keyed by slug). */
function useCategoryLabel() {
  const { t, s, locale } = useLocale();
  return (slug: string): string => {
    const entry = (s.categories as Record<string, Parameters<typeof t>[0]>)[slug];
    return entry ? t(entry) : locale === 'rw' ? slug : slug;
  };
}

interface ListData {
  items: Article[];
  total: number;
}

/** Story table: filter, search, bulk actions, one-click flags. */
export default function AdminArticlesPage() {
  const { t, s, locale } = useLocale();
  const catLabel = useCategoryLabel();
  const router = useRouter();
  const A = s.admin;
  const { toast, show } = useToast();
  // Header search / notification links deep-query this table: ?q= &state=
  const initial = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [q, setQ] = useState(initial?.get('q') ?? '');
  const [query, setQuery] = useState(initial?.get('q') ?? '');
  const [category, setCategory] = useState(
    (initial && (CATEGORY_SLUGS as string[]).includes(initial.get('category') ?? '') ? initial.get('category') : 'all') ?? 'all',
  );
  const [state, setState] = useState(
    initial && ['all', 'draft', 'scheduled', 'published', 'archived'].includes(initial.get('state') ?? '') ? initial.get('state')! : 'all',
  );
  const [videoOnly, setVideoOnly] = useState(initial?.get('video') === '1');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ q: query, category, publishState: state, limit: String(PAGE_SIZE), offset: String(offset) });
      if (videoOnly) p.set('video', '1');
      const data = await adminGet<ListData>(`/api/admin/articles?${p.toString()}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [query, category, state, videoOnly, offset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const flag = async (id: string, patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      await adminSend(`/api/admin/articles/${encodeURIComponent(id)}`, 'PATCH', patch);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      show(t(A.saved), 'ok');
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const bulk = async (action: string) => {
    if (!selected.length) return;
    if (action === 'delete' && !window.confirm(t(A.deleteConfirm))) return;
    setBusy(true);
    try {
      await adminSend('/api/admin/articles', 'PATCH', { ids: selected, action });
      setSelected([]);
      show(`${selected.length} × ${action}`, 'ok');
      void load();
      router.refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const allSelected = items.length > 0 && selected.length === items.length;

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(A.articles)}</h1>
        <span className="x-chip">{total}</span>
        <Link href="/admin-control/articles/new" className="x-btn x-btn--primary ms-auto">
          <Plus size={14} aria-hidden />
          {t(A.newStory)}
        </Link>
      </div>

      <Panel
        title={t(A.overview)}
        actions={
          <button type="button" onClick={() => void load()} className="x-btn x-btn--ghost x-btn--sm">
            {t(s.states.retry)}
          </button>
        }
      >
        <form
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            setQuery(q.trim());
          }}
        >
          <Field label={t(s.search.label)} className="lg:col-span-2">
            <div className="relative">
              <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="x-input ps-8" placeholder={t(A.searchPlaceholder)} />
            </div>
          </Field>
          <Field label={t(A.categories)}>
            <select
              value={category}
              onChange={(e) => {
                setOffset(0);
                setCategory(e.target.value);
              }}
              className="x-input"
            >
              <option value="all">{t(s.filters.allCategories)}</option>
              {CATEGORY_SLUGS.map((c) => (
                <option key={c} value={c}>
                  {(s.categories as Record<string, { rw: string; en: string }>)[c]?.[locale === 'rw' ? 'rw' : 'en'] ?? c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(s.admin.filters.state)}>
            <select
              value={state}
              onChange={(e) => {
                setOffset(0);
                setState(e.target.value);
              }}
              className="x-input"
            >
              <option value="all">{t(s.admin.filters.all)}</option>
              <option value="published">{t(A.state.published)}</option>
              <option value="draft">{t(A.state.draft)}</option>
              <option value="scheduled">{t(A.state.scheduled)}</option>
              <option value="archived">{t(A.state.archived)}</option>
            </select>
          </Field>
          <div className="flex flex-wrap items-end gap-2">
            <button type="submit" className="x-btn x-btn--ghost x-btn--sm">
              <Filter size={13} aria-hidden />
              {t(s.search.label)}
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoOnly((v) => !v);
                setOffset(0);
              }}
              className={`x-btn x-btn--sm ${videoOnly ? 'x-btn--primary' : 'x-btn--ghost'}`}
            >
              <Play size={13} aria-hidden />
              {t(A.filters.hasVideo)}
            </button>
            {(query || category !== 'all' || state !== 'all' || videoOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setQuery('');
                  setCategory('all');
                  setState('all');
                  setVideoOnly(false);
                  setOffset(0);
                }}
                className="x-btn x-btn--ghost x-btn--sm"
              >
                {t(s.filters.clear)}
              </button>
            )}
          </div>
        </form>
      </Panel>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <Panel title={t(A.articles)}>
          <Empty message={t(A.noArticles)} />
        </Panel>
      ) : (
        <Panel
          title={`${selected.length ? `${selected.length} ${t(s.admin.table.selected)}` : t(A.stories)}`}
          actions={
            selected.length > 0 ? (
              <>
                <button type="button" disabled={busy} onClick={() => void bulk('publish')} className="x-btn x-btn--ghost x-btn--sm">
                  {t(A.state.published)}
                </button>
                <button type="button" disabled={busy} onClick={() => void bulk('draft')} className="x-btn x-btn--ghost x-btn--sm">
                  {t(A.state.draft)}
                </button>
                <button type="button" disabled={busy} onClick={() => void bulk('feature')} className="x-btn x-btn--ghost x-btn--sm">
                  <Star size={12} aria-hidden />
                  {t(A.fields.featured)}
                </button>
                <button type="button" disabled={busy} onClick={() => void bulk('delete')} className="x-btn x-btn--danger x-btn--sm">
                  <Trash2 size={12} aria-hidden />
                  {t(s.common.delete)}
                </button>
              </>
            ) : undefined
          }
        >
          <div className="x-scroll-x -mx-3 sm:-mx-4">
            <table className="x-table min-w-[52rem]">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox"
                      aria-label={t(s.admin.table.selected)}
                      checked={allSelected}
                      onChange={(e) => setSelected(e.target.checked ? items.map((a) => a.id) : [])}
                    />
                  </th>
                  <th>{t(s.admin.table.title)}</th>
                  <th className="w-24">{t(s.admin.filters.state)}</th>
                  <th className="w-28">{t(A.categories)}</th>
                  <th className="w-24">{t(s.admin.table.media)}</th>
                  <th className="w-20 text-end">{t(s.admin.table.views)}</th>
                  <th className="w-36 text-end">{t(s.admin.table.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={a.titleKiny || a.title}
                        checked={selected.includes(a.id)}
                        onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)))}
                      />
                    </td>
                    <td className="max-w-[28rem]">
                      <div className="flex items-start gap-1.5">
                        <StateDot state={a.publishState ?? 'published'} />
                        <span className="min-w-0">
                          <Link href={`/admin-control/articles/${encodeURIComponent(a.id)}`} className="block truncate font-medium text-ink hover:text-brand-ink">
                            {locale === 'rw' ? a.titleKiny || a.title : a.title}
                          </Link>
                          <span className="block truncate text-[11px] text-ink/45">
                            {a.sources?.[0]?.name ?? 'IbiheNews'} · <TimeAgo iso={a.publishedAt} locale={locale} />
                            {a.isMock ? ' · demo' : ''}
                            {a.authorName ? ` · ${a.authorName}` : ''}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={a.publishState ?? 'published'}
                        onChange={(e) => void flag(a.id, { publishState: e.target.value })}
                        className="x-input !px-2 !py-1 !text-[11px]"
                        aria-label={`${a.title} state`}
                      >
                        <option value="draft">{t(A.state.draft)}</option>
                        <option value="published">{t(A.state.published)}</option>
                        <option value="scheduled">{t(A.state.scheduled)}</option>
                        <option value="archived">{t(A.state.archived)}</option>
                      </select>
                    </td>
                    <td className="text-[12px] text-ink/60">{catLabel(a.category)}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-[12px] text-ink/60">
                        {(a.videos?.length ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-brand-ink">
                            <Play size={11} aria-hidden />
                            {a.videos?.length}
                          </span>
                        )}
                        {(a.imageUrl || (a.gallery?.length ?? 0) > 0) && <span>{1 + (a.gallery?.length ?? 0)} 🖼</span>}
                      </span>
                    </td>
                    <td className="text-end text-[12px] tabular-nums text-ink/60">{(a.views ?? 0).toLocaleString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => void flag(a.id, { featured: !a.featured })}
                          aria-pressed={Boolean(a.featured)}
                          className={`rounded-md p-1.5 transition-colors hover:bg-fill-2 ${a.featured ? 'text-brand-ink' : 'text-ink/35'}`}
                          aria-label={t(A.fields.featured)}
                          title={t(A.fields.featured)}
                        >
                          <Star size={13} aria-hidden fill={a.featured ? 'currentColor' : 'none'} />
                        </button>
                        <Link
                          href={`/amakuru/${encodeURIComponent(a.id)}`}
                          target="_blank"
                          className="rounded-md p-1.5 text-ink/35 hover:bg-fill-2 hover:text-ink"
                          aria-label={t(A.openStory)}
                          title={t(A.openStory)}
                        >
                          <Eye size={13} aria-hidden />
                        </Link>
                        <Link
                          href={`/admin-control/articles/${encodeURIComponent(a.id)}`}
                          className="rounded-md px-2 py-1 text-[12px] font-semibold text-ink/60 hover:bg-fill-2 hover:text-ink"
                        >
                          {t(s.common.edit)}
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void (async () => {
                            if (!window.confirm(t(A.deleteConfirm))) return;
                            await flag(a.id, {});
                            await adminSend(`/api/admin/articles/${encodeURIComponent(a.id)}`, 'DELETE');
                            void load();
                          })()}
                          className="rounded-md p-1.5 text-ink/35 hover:bg-fill-2 hover:text-danger"
                          aria-label={t(A.deleteArticle)}
                        >
                          <Trash2 size={13} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager offset={offset} total={total} pageSize={PAGE_SIZE} onOffset={setOffset} />
        </Panel>
      )}
    </div>
  );
}
