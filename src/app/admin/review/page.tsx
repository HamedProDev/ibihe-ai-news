'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Flag, Pencil, ShieldAlert } from 'lucide-react';
import type { ReviewItem } from '@/lib/review/types';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ApiError } from '@/lib/client/api';

const SECRET_KEY = 'ibihe-admin-secret';

function decodeForDisplay(field: ReviewItem['field'], raw: string): string {
  if (field !== 'keyPointsKiny') return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string').join('\n');
  } catch {
    /* not JSON — show raw */
  }
  return raw;
}

function ReviewCard({ item, secret, onDecided }: { item: ReviewItem; secret: string; onDecided: () => void }) {
  const { locale } = useLocale();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(decodeForDisplay(item.field, item.proposedRw));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (decision: 'approve' | 'edit' | 'flag') => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ id: item.id, decision, editedRaw: decision === 'edit' ? text : undefined, note, reviewer: 'admin-ui' }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { messageEn: string } };
      if (!json.ok) throw new Error(json.error?.messageEn ?? 'failed');
      onDecided();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-[#111] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[11px] font-mono text-white/50">{item.field}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded border ${item.status === 'pending' ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : 'text-white/50 border-white/15'}`}>
          {item.status}
        </span>
        <span className="ml-auto text-[11px] text-white/35">{item.ai.model} · {item.ai.promptVersion}</span>
      </div>
      <p className="text-white/60 text-[13px] mb-3">
        {item.context.titleEn ?? item.refId} — {item.context.sourceName ?? ''}
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
          <p className="text-white/40 text-[11px] uppercase tracking-widest mb-1.5">Current</p>
          <p className="text-white/75 text-[13px] whitespace-pre-line">{decodeForDisplay(item.field, item.currentRw) || '—'}</p>
        </div>
        <div className="bg-[#00c853]/[0.06] border border-[#00c853]/25 rounded-xl p-3">
          <p className="text-[#00c853] text-[11px] uppercase tracking-widest mb-1.5">Proposed (AI)</p>
          {editing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full bg-black/30 border border-white/15 rounded-lg p-2 text-white/85 text-[13px] focus:outline-none focus:border-[#00c853]/60"
            />
          ) : (
            <p className="text-white/85 text-[13px] whitespace-pre-line">{decodeForDisplay(item.field, item.proposedRw)}</p>
          )}
        </div>
      </div>
      {item.status === 'pending' && (
        <div className="flex flex-col gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={locale === 'rw' ? 'Icyitonderwa (optional)' : 'Note (optional)'}
            className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/30"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => decide('approve')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-[#00c853] text-black text-[13px] font-semibold rounded-lg px-3.5 py-2 hover:bg-[#00e65f] disabled:opacity-40"
            >
              <Check size={14} aria-hidden="true" /> Approve
            </button>
            {editing ? (
              <button
                onClick={() => decide('edit')}
                disabled={busy || !text.trim()}
                className="inline-flex items-center gap-1.5 bg-blue-500 text-white text-[13px] font-semibold rounded-lg px-3.5 py-2 hover:bg-blue-400 disabled:opacity-40"
              >
                <Pencil size={14} aria-hidden="true" /> Save edit
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[13px] font-medium rounded-lg px-3.5 py-2 hover:bg-white/15 disabled:opacity-40"
              >
                <Pencil size={14} aria-hidden="true" /> Edit
              </button>
            )}
            <button
              onClick={() => decide('flag')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white/10 text-red-300 text-[13px] font-medium rounded-lg px-3.5 py-2 hover:bg-white/15 disabled:opacity-40"
            >
              <Flag size={14} aria-hidden="true" /> Flag
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </article>
  );
}

function ImportCard({ secret }: { secret: string }) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    setBusy(true);
    setResult('');
    try {
      const res = await fetch('/api/market/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ csv }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { added: number; errors: Array<{ row: number; message: string }> }; error?: { messageEn: string } };
      if (!json.ok || !json.data) throw new Error(json.error?.messageEn ?? 'failed');
      const errs = json.data.errors.map((e) => `row ${e.row}: ${e.message}`).join('\n');
      setResult(`added=${json.data.added}${errs ? `\n${errs}` : ''}`);
      if (json.data.added > 0) setCsv('');
    } catch (e) {
      setResult(`ERROR: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="import-h" className="bg-[#111] border border-white/10 rounded-2xl p-4 mb-6">
      <h2 id="import-h" className="text-white text-[15px] font-bold mb-1">Market CSV import</h2>
      <p className="text-white/40 text-xs mb-3 font-mono">commodity,price,unit,market,district,observed_at,source_name,source_url</p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={4}
        placeholder="ibirayi,500,kg,Kimironko,Gasabo,2026-09-10,Ibihe field team,https://example.com/report"
        className="w-full bg-black/30 border border-white/15 rounded-xl p-3 text-white/85 text-[13px] font-mono focus:outline-none focus:border-[#00c853]/60 mb-2"
      />
      <button
        onClick={run}
        disabled={busy || !csv.trim()}
        className="bg-[#00c853] text-black text-[13px] font-semibold rounded-lg px-4 py-2 hover:bg-[#00e65f] disabled:opacity-40"
      >
        {busy ? 'Importing…' : 'Import observations'}
      </button>
      {result && <pre className="mt-2 text-xs text-white/60 whitespace-pre-wrap">{result}</pre>}
    </section>
  );
}

export default function AdminReviewPage() {
  const { locale } = useLocale();
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(SECRET_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time session hydration
        setSecret(saved);
        setUnlocked(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review?status=${filter}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const json = (await res.json()) as { ok: boolean; data?: { items: ReviewItem[] }; error?: { code: string; messageKiny: string; messageEn: string } };
      if (!json.ok || !json.data) {
        if (res.status === 401) {
          setUnlocked(false);
          throw new ApiError('unauthorized', 'Uruhushya ntirwemewe.', 'Invalid secret.');
        }
        throw new ApiError(json.error?.code ?? 'failed', json.error?.messageKiny ?? '', json.error?.messageEn ?? 'failed');
      }
      setItems(json.data.items);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('network', 'Ntibashoboye guhuza.', 'Network error.'));
    } finally {
      setLoading(false);
    }
  }, [unlocked, secret, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial queue load (setState happens in async fetch below)
    load();
  }, [load]);

  const unlock = () => {
    if (!secret.trim()) return;
    try {
      window.sessionStorage.setItem(SECRET_KEY, secret.trim());
    } catch {
      /* ignore */
    }
    setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center">
          <ShieldAlert size={24} className="text-amber-300 mx-auto mb-3" aria-hidden="true" />
          <h1 className="text-white font-bold text-lg mb-1">Admin — Review queue</h1>
          <p className="text-white/50 text-[13px] mb-4">
            {locale === 'rw' ? 'Andika ADMIN_SECRET kugira ngo winjire.' : 'Enter the ADMIN_SECRET to continue.'}
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && unlock()}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white mb-3 focus:outline-none focus:border-[#00c853]/60"
            aria-label="ADMIN_SECRET"
          />
          <button onClick={unlock} className="w-full bg-[#00c853] text-black text-sm font-semibold rounded-xl py-2.5 hover:bg-[#00e65f]">
            Unlock
          </button>
          {error && <div className="mt-3"><ErrorState error={error} /></div>}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Admin — Review queue</h1>
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border ${filter === f ? 'bg-[#00c853] text-black border-[#00c853]' : 'text-white/60 border-white/15'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ImportCard secret={secret} />

      {loading ? (
        <LoadingSkeleton lines={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState message={locale === 'rw' ? 'Nta cyitegereje.' : 'Queue is empty.'} />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <ReviewCard key={it.id} item={it} secret={secret} onDecided={load} />
          ))}
        </div>
      )}
    </main>
  );
}
