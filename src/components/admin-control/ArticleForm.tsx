'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/i18n/LanguageProvider';
import type { Article } from '@/types/news';

const CATEGORIES = [
  'rwanda', 'amahanga', 'ubukungu', 'politiki', 'ikoranabuhanga',
  'ubuzima', 'uburezi', 'imyidagaduro', 'imikino', 'umuco',
] as const;

const STATUSES = ['verified', 'developing', 'multi-source', 'analysis', 'forecast', 'opinion'] as const;

export interface ArticleFormValue {
  title: string;
  titleKiny: string;
  excerpt: string;
  excerptKiny: string;
  category: string;
  status: string;
  imageUrl: string;
  keyPoints: string;
  sourceName: string;
  sourceUrl: string;
}

function toValue(a?: Article | null): ArticleFormValue {
  return {
    title: a?.title ?? '',
    titleKiny: a?.titleKiny ?? '',
    excerpt: a?.excerpt ?? '',
    excerptKiny: a?.excerptKiny ?? '',
    category: a?.category ?? 'amahanga',
    status: a?.status ?? 'developing',
    imageUrl: a?.imageUrl ?? '',
    keyPoints: (a?.keyPointsKiny ?? []).join('\n'),
    sourceName: a?.sources[0]?.name ?? 'Ibihe',
    sourceUrl: a?.sources[0]?.url ?? '',
  };
}

const inputCls =
  'mt-1 w-full bg-ink/5 border border-ink/15 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/60';
const labelCls = 'text-ink/60 text-[13px]';

export function ArticleForm({ initial, method, url }: { initial?: Article | null; method: 'POST' | 'PUT'; url: string }) {
  const { s, locale } = useLocale();
  const router = useRouter();
  const t = (e: { rw: string; en: string }) => (locale === 'rw' ? e.rw : e.en);
  const [v, setV] = useState<ArticleFormValue>(() => toValue(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof ArticleFormValue, val: string) => setV((prev) => ({ ...prev, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: v.title,
          titleKiny: v.titleKiny || undefined,
          excerpt: v.excerpt,
          excerptKiny: v.excerptKiny || undefined,
          category: v.category,
          status: v.status,
          imageUrl: v.imageUrl || undefined,
          keyPointsKiny: v.keyPoints.split('\n').map((l) => l.trim()).filter(Boolean),
          sourceName: v.sourceName,
          sourceUrl: v.sourceUrl || undefined,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { messageKiny: string; messageEn: string } };
      if (!json.ok) {
        setError(
          locale === 'rw'
            ? (json.error?.messageKiny ?? 'Habaye ikosa.')
            : (json.error?.messageEn ?? 'Something went wrong.'),
        );
        return;
      }
      router.push('/admin-control/articles');
      router.refresh();
    } catch {
      setError(t({ rw: 'Habaye ikosa.', en: 'Something went wrong.' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 bg-surface border border-ink/10 rounded-2xl p-4 sm:p-6">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>{t(s.form.title)} *</span>
          <input required value={v.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{t(s.form.titleKiny)}</span>
          <input value={v.titleKiny} onChange={(e) => set('titleKiny', e.target.value)} className={inputCls} />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>{t(s.form.excerpt)} *</span>
        <textarea required rows={3} value={v.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={inputCls} />
      </label>
      <label className="block">
        <span className={labelCls}>{t(s.form.excerptKiny)}</span>
        <textarea rows={3} value={v.excerptKiny} onChange={(e) => set('excerptKiny', e.target.value)} className={inputCls} />
      </label>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className={labelCls}>{t(s.form.category)} *</span>
          <select value={v.category} onChange={(e) => set('category', e.target.value)} className={`${inputCls} bg-surface`}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(s.categories[c])}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>{t(s.form.status)}</span>
          <select value={v.status} onChange={(e) => set('status', e.target.value)} className={`${inputCls} bg-surface`}>
            {STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>{t(s.form.imageUrl)}</span>
          <input
            value={v.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://…"
            className={inputCls}
          />
        </label>
      </div>
      {v.imageUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of external URL */}
          <img
            src={v.imageUrl}
            alt=""
            className="h-28 rounded-xl border border-ink/10 object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        </div>
      )}
      <label className="block">
        <span className={labelCls}>{t(s.form.keyPoints)}</span>
        <textarea rows={4} value={v.keyPoints} onChange={(e) => set('keyPoints', e.target.value)} className={inputCls} />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>{t(s.form.sourceName)}</span>
          <input value={v.sourceName} onChange={(e) => set('sourceName', e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{t(s.form.sourceUrl)}</span>
          <input value={v.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" className={inputCls} />
        </label>
      </div>
      {error && <p className="text-danger text-[13px]">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="bg-brand text-on-brand text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-brand-bright disabled:opacity-40"
        >
          {busy ? '…' : t(s.common.save)}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin-control/articles')}
          className="bg-ink/10 text-ink text-sm rounded-xl px-5 py-2.5 hover:bg-ink/15"
        >
          {t(s.common.cancel)}
        </button>
      </div>
    </form>
  );
}
