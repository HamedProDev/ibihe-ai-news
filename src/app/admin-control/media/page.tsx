'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Upload } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ChipGroup, ConfirmButton, Empty, ErrorNote, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';
import type { MediaRow } from '@/components/admin-control/MediaField';

const PAGE = 60;

/** Media library: upload, browse, copy URLs, delete. */
export default function AdminMediaPage() {
  const { t, s } = useLocale();
  const A = s.admin.media;
  const { toast, show } = useToast();
  const [kind, setKind] = useState<'all' | 'image' | 'document'>('all');
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [q, setQ] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: MediaRow[] }>(`/api/admin/media?limit=${PAGE}&kind=${kind}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      setItems(data.items);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [kind, q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('kind', file.type.startsWith('image/') ? 'image' : 'document');
      await adminSend('/api/admin/media', 'POST', form);
      show(t(A.uploaded), 'ok');
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
        <h1 className="x-title-2 text-ink">{t(s.admin.mediaLibrary)}</h1>
        <span className="x-chip">{items.length}</span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(s.search.label)} className="x-input !w-40 !py-1.5" />
          <ChipGroup
            ariaLabel={t(A.search)}
            value={kind}
            onChange={setKind}
            options={[
              { id: 'all', label: t(s.admin.filters.all) },
              { id: 'image', label: 'Images' },
              { id: 'document', label: 'Docs' },
            ]}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="x-btn x-btn--primary x-btn--sm">
            <Upload size={13} aria-hidden />
            {t(A.upload)}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 bg-fill px-3 py-3 text-[12px] text-ink/50"
      >
        <Upload size={14} aria-hidden />
        {t(A.dropHint)} · {t(A.maxSize)} 2 MB
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <Panel title={t(s.admin.mediaLibrary)}>
          <Empty message={t(A.empty)} />
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => {
            const src = m.storage === 'inline' || !m.url ? `/api/media/${m.id}` : m.url;
            return (
              <figure key={m.id} className="x-card overflow-hidden">
                {m.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element -- library grid
                  <img src={src} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full bg-surface-2 object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 px-2 text-center text-[11px] text-ink/50">{m.mime || m.kind}</div>
                )}
                <figcaption className="space-y-1 p-2">
                  <p className="truncate text-[11px] text-ink/60" title={m.alt || m.id}>
                    {m.alt || m.id}
                  </p>
                  <p className="text-[10px] text-ink/35">
                    {m.bytes ? `${Math.max(1, Math.round(m.bytes / 1024))} KB` : 'link'} · {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(window.location.origin + src).then(() => {
                          setCopied(m.id);
                          setTimeout(() => setCopied(''), 1600);
                        });
                      }}
                      className="rounded-md p-1 text-ink/45 hover:bg-fill-2 hover:text-ink"
                      aria-label={t(A.copyUrl)}
                    >
                      {copied === m.id ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                    </button>
                    <ConfirmButton
                      className="ms-auto !px-1.5 !py-1"
                      label={t(A.delete)}
                      confirmLabel="?"
                      busy={busy}
                      onConfirm={() => {
                        setBusy(true);
                        void adminSend(`/api/admin/media?id=${encodeURIComponent(m.id)}`, 'DELETE')
                          .then(() => load())
                          .finally(() => setBusy(false));
                      }}
                    />
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
