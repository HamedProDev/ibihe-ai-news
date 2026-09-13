'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Images, Link2, Trash2, Upload } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Field, Loading, Modal, Toast, useToast } from './ui';

export interface MediaRow {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  mime: string;
  url: string;
  alt: string;
  caption: string;
  credit: string;
  bytes: number;
  storage: 'inline' | 'url';
  createdAt: string;
}

const mediaSrc = (m: Pick<MediaRow, 'storage' | 'url' | 'id'>) => (m.storage === 'inline' || !m.url ? `/api/media/${m.id}` : m.url);

/** Library browser (search + grid) used by every picker in the console. */
function LibraryBrowser({ onPick, kind }: { onPick: (m: MediaRow) => void; kind: 'image' | 'document' | 'all' }) {
  const { t, s } = useLocale();
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ items: MediaRow[] }>(
        `/api/admin/media?limit=60&kind=${kind}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`,
      );
      setItems(data.items);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [q, kind]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(s.admin.media.search)}
        aria-label={t(s.admin.media.search)}
        className="x-input"
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <Empty message={t(s.admin.media.empty)} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(m)}
              className="group overflow-hidden rounded-xl border border-line bg-fill text-start transition-colors hover:border-brand"
            >
              {m.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- library thumbnail
                <img src={mediaSrc(m)} alt={m.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-xs text-ink/50">{m.mime || m.kind}</div>
              )}
              <span className="block truncate px-2 py-1.5 text-[11px] text-ink/60 group-hover:text-ink">{m.alt || m.caption || m.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One image/document slot: upload from disk, pick from the library or paste a
 * URL. The stored value is always something the browser can load
 * (/api/media/<id> for uploads, or an https URL).
 */
export function MediaField({
  label,
  value,
  onChange,
  kind = 'image',
  hint,
  alt,
  onAltChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: 'image' | 'document';
  hint?: string;
  alt?: string;
  onAltChange?: (v: string) => void;
}) {
  const { t, s } = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'upload' | 'library' | 'url'>('library');
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const { toast, show } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openModal = (next: 'upload' | 'library' | 'url') => {
    setMode(next);
    if (next === 'url') setUrlDraft(value);
    setOpen(true);
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('kind', kind);
      if (alt) form.set('alt', alt);
      const data = await adminSend<{ asset: MediaRow }>('/api/admin/media', 'POST', form);
      onChange(mediaSrc(data.asset));
      show(t(s.admin.media.uploaded), 'ok');
      setOpen(false);
    } catch (e) {
      show(e instanceof Error ? e.message : 'upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-fill">
          {value ? (
            <>
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview
                <img src={value} alt={alt ?? ''} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-ink/55">
                  {value.split('/').pop()}
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute end-1 top-1 rounded-md bg-black/60 p-1 text-on-image hover:bg-black/80"
                aria-label={t(s.admin.media.delete)}
              >
                <Trash2 size={12} aria-hidden />
              </button>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-ink/25">
              <ImagePlus size={18} aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-w-[13rem] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => openModal('upload')} className="x-btn x-btn--ghost x-btn--sm">
              <Upload size={13} aria-hidden />
              {t(s.admin.media.upload)}
            </button>
            <button type="button" onClick={() => openModal('library')} className="x-btn x-btn--ghost x-btn--sm">
              <Images size={13} aria-hidden />
              {t(s.admin.media.fromLibrary)}
            </button>
            <button type="button" onClick={() => openModal('url')} className="x-btn x-btn--ghost x-btn--sm">
              <Link2 size={13} aria-hidden />
              URL
            </button>
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…  ·  /api/media/…"
            className="x-input !py-1.5 text-[12px]"
            aria-label={`${label} URL`}
            dir="ltr"
          />
          {onAltChange && (
            <input
              value={alt ?? ''}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="alt / description (accessibility)"
              className="x-input !py-1.5 text-[12px]"
              aria-label="alt"
            />
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={label} wide>
        <div className="mb-3 flex gap-1.5">
          {(['upload', 'library', 'url'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`x-btn x-btn--sm ${mode === m ? 'x-btn--primary' : 'x-btn--ghost'}`}
            >
              {m === 'upload' ? t(s.admin.media.upload) : m === 'library' ? t(s.admin.media.fromLibrary) : 'URL'}
            </button>
          ))}
        </div>

        {mode === 'upload' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-2 bg-fill p-8 text-center"
          >
            <Upload size={22} className="text-ink/40" aria-hidden />
            <p className="text-[13px] text-ink/60">{t(s.admin.media.dropHint)}</p>
            <input
              ref={fileRef}
              type="file"
              accept={kind === 'image' ? 'image/*' : '.pdf,application/pdf'}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="x-btn x-btn--primary x-btn--sm">
              {busy ? '…' : t(s.admin.media.upload)}
            </button>
            <p className="text-[11px] text-ink/40">{t(s.admin.media.maxSize)} — PNG, JPG, WEBP, PDF</p>
          </div>
        )}

        {mode === 'library' && (
          <LibraryBrowser
            kind={kind === 'document' ? 'document' : 'image'}
            onPick={(m) => {
              onChange(mediaSrc(m));
              if (onAltChange && m.alt) onAltChange(m.alt);
              setOpen(false);
            }}
          />
        )}

        {mode === 'url' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onChange(urlDraft.trim());
              setOpen(false);
            }}
            className="space-y-3"
          >
            <Field label="URL">
              <input autoFocus value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} className="x-input" placeholder="https://…" dir="ltr" />
            </Field>
            <button type="submit" className="x-btn x-btn--primary">
              {t(s.admin.media.useAsset)}
            </button>
          </form>
        )}

        {toast && (
          <div className="mt-3">
            <Toast message={toast.message} tone={toast.tone} />
          </div>
        )}
      </Modal>
    </Field>
  );
}

/** Reusable picker for the gallery (multi) and attachments (multi). */
export function MediaUrlListField({
  label,
  items,
  onChange,
  kind = 'image',
}: {
  label: string;
  items: Array<{ url: string }>;
  onChange: (items: Array<{ url: string }>) => void;
  kind?: 'image' | 'document';
}) {
  const { t, s } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={`${it.url}-${i}`} className="flex items-center gap-2 rounded-xl bg-fill px-2 py-1.5">
            {kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview
              <img src={it.url} alt="" className="size-9 shrink-0 rounded-lg object-cover" loading="lazy" />
            ) : (
              <span className="size-9 shrink-0 rounded-lg bg-surface-2" aria-hidden />
            )}
            <span className="min-w-0 flex-1 truncate text-[12px] text-ink/70" dir="ltr">
              {it.url}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded-lg p-1.5 text-ink/45 hover:bg-fill-2 hover:text-danger"
              aria-label={t(s.admin.media.delete)}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setOpen(true)} className="x-btn x-btn--ghost x-btn--sm mt-2">
        <ImagePlus size={13} aria-hidden />
        {t(s.admin.media.fromLibrary)}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label} wide>
        <LibraryBrowser
          kind={kind === 'document' ? 'document' : 'image'}
          onPick={(m) => {
            onChange([...items, { url: mediaSrc(m) }]);
            setOpen(false);
          }}
        />
      </Modal>
    </Field>
  );
}
