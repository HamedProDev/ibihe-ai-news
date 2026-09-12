'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Article } from '@/types/news';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { ApiError } from '@/lib/client/api';

const PAGE_SIZE = 20;

export default function AdminArticlesPage() {
  const { s, locale } = useLocale();
  const t = (e: { rw: string; en: string }) => (locale === 'rw' ? e.rw : e.en);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: { items: Article[]; total: number };
        error?: { code: string; messageKiny: string; messageEn: string };
      };
      if (!json.ok || !json.data) {
        throw new ApiError(json.error?.code ?? 'failed', json.error?.messageKiny ?? '', json.error?.messageEn ?? 'failed');
      }
      setItems(json.data.items);
      setTotal(json.data.total);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('network', 'Habaye ikosa.', 'Network error.'));
    } finally {
      setLoading(false);
    }
  }, [query, offset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm(t(s.admin.deleteConfirm))) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h1 className="text-white text-xl font-bold">{t(s.admin.articles)}</h1>
        <span className="text-white/40 text-sm">{total}</span>
        <Link
          href="/admin/articles/new"
          className="ml-auto inline-flex items-center gap-1.5 bg-[#00c853] text-black text-[13px] font-semibold rounded-lg px-3.5 py-2 hover:bg-[#00e65f]"
        >
          <Plus size={14} aria-hidden="true" />
          {t(s.admin.newArticle)}
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setQuery(q);
        }}
        className="relative mb-4"
      >
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(s.admin.searchPlaceholder)}
          className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#00c853]/60"
        />
      </form>

      {loading ? (
        <LoadingSkeleton lines={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState message={t(s.admin.noArticles)} />
      ) : (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-white/5">
            {items.map((a) => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{locale === 'rw' ? a.titleKiny : a.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {t(s.categories[a.category])} · {a.status} · {a.sources[0]?.name ?? ''} ·{' '}
                    {a.publishedAt.slice(0, 10)}
                    {a.isMock ? ' · demo' : ''}
                  </p>
                </div>
                <Link
                  href={`/admin/articles/${encodeURIComponent(a.id)}`}
                  aria-label={t(s.common.edit)}
                  className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10"
                >
                  <Pencil size={15} aria-hidden="true" />
                </Link>
                <button
                  onClick={() => remove(a.id)}
                  disabled={deleting === a.id}
                  aria-label={t(s.common.delete)}
                  className="text-red-300/80 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 disabled:opacity-40"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <button
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              className="text-white/60 hover:text-white text-[13px] disabled:opacity-30"
            >
              ← {t(s.common.back)}
            </button>
            <span className="text-white/40 text-xs">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}
            </span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              className="text-white/60 hover:text-white text-[13px] disabled:opacity-30"
            >
              {t(s.admin.articles)} →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
