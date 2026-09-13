'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Field, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';

interface Bullet {
  articleId: string;
  textKiny: string;
  textEn: string;
}

interface BriefingDoc {
  day?: string;
  bullets?: Bullet[];
  articleCount?: number;
  editedBy?: string;
}

/** Read, regenerate and hand-edit the daily AI briefing. */
export default function AdminBriefingPage() {
  const { t, s } = useLocale();
  const A = s.admin.briefingAdmin;
  const { toast, show } = useToast();
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState<string[]>([]);
  const [doc, setDoc] = useState<BriefingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ briefing: BriefingDoc | null; days: string[] }>(`/api/admin/briefing?day=${day}`);
      setDoc(data.briefing ?? null);
      setDays(data.days ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const bullets = doc?.bullets ?? [];
  const setBullets = (next: Bullet[]) => setDoc((prev) => ({ ...(prev ?? {}), bullets: next }));

  const regenerate = async () => {
    setBusy(true);
    try {
      const data = await adminSend<{ briefing: BriefingDoc }>('/api/admin/briefing', 'POST', { day });
      setDoc(data.briefing);
      show(t(A.regenerate), 'ok');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await adminSend('/api/admin/briefing', 'PUT', { day, briefing: { ...(doc ?? {}), bullets } });
      show(t(s.admin.saved), 'ok');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.briefing)}</h1>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="x-input !w-auto !py-1.5" aria-label={t(A.day)} />
          {days.length > 0 && (
            <select value={day} onChange={(e) => setDay(e.target.value)} className="x-input !w-auto !py-1.5" aria-label={t(A.day)}>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => void regenerate()} disabled={busy} className="x-btn x-btn--ghost x-btn--sm">
            <RefreshCw size={13} aria-hidden />
            {t(A.generate)}
          </button>
          <button type="button" onClick={() => void save()} disabled={busy} className="x-btn x-btn--primary x-btn--sm">
            <Save size={13} aria-hidden />
            {t(s.common.save)}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
      {doc?.editedBy && (
        <p className="x-chip w-fit">
          <Sparkles size={11} aria-hidden />
          {t(A.edited)} · {doc.editedBy}
        </p>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : bullets.length === 0 ? (
        <Panel title={t(s.admin.briefing)}>
          <Empty message={t(A.empty)} />
        </Panel>
      ) : (
        <Panel title={`${bullets.length} ${t(A.bullets).toLowerCase()}`}>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="grid gap-2 rounded-xl border border-line bg-fill p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
                <Field label="Kinyarwanda">
                  <textarea rows={2} value={b.textKiny} onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? { ...x, textKiny: e.target.value } : x)))} className="x-input" />
                </Field>
                <Field label="English">
                  <textarea rows={2} value={b.textEn} onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? { ...x, textEn: e.target.value } : x)))} className="x-input" />
                </Field>
                <Field label={t(A.articleId)}>
                  <input value={b.articleId} onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? { ...x, articleId: e.target.value } : x)))} className="x-input" dir="ltr" />
                  <Link href={`/amakuru/${encodeURIComponent(b.articleId)}`} target="_blank" className="mt-1 inline-block text-[11px] text-brand-ink hover:underline">
                    {t(s.admin.openStory)}
                  </Link>
                </Field>
                <div className="sm:col-span-3">
                  <button type="button" onClick={() => setBullets(bullets.filter((_, j) => j !== i))} className="x-btn x-btn--ghost x-btn--sm">
                    <Trash2 size={12} aria-hidden />
                    {t(s.common.delete)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setBullets([...bullets, { articleId: '', textKiny: '', textEn: '' }])}
            className="x-btn x-btn--ghost x-btn--sm mt-2"
          >
            <Plus size={13} aria-hidden />
            {t(A.addBullet)}
          </button>
        </Panel>
      )}
    </div>
  );
}
