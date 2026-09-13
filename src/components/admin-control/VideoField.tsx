'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { VideoAsset } from '@/types/news';
import { durationLabel, parseVideoUrl, PROVIDER_LABELS } from '@/lib/media/video';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Field } from './ui';

/**
 * The video embed editor. An editor pastes any provider link; we parse it,
 * show what will be framed, and store the normalized asset. The API re-parses
 * the URL on save, so what you see here is what gets embedded.
 */
export function VideoField({
  videos,
  onChange,
  onInsertToken,
}: {
  videos: VideoAsset[];
  onChange: (next: VideoAsset[]) => void;
  onInsertToken?: (token: string) => void;
}) {
  const { t, s } = useLocale();
  const A = s.admin.videos;
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');

  const add = () => {
    const parsed = parseVideoUrl(draft);
    if (!parsed) {
      setError(t(A.unsupported));
      return;
    }
    const id = `vid-${Date.now().toString(36)}-${videos.length}`;
    onChange([
      ...videos,
      {
        id,
        provider: parsed.provider,
        ...(parsed.videoId ? { videoId: parsed.videoId } : {}),
        url: parsed.url,
        embedUrl: parsed.embedUrl,
        ...(parsed.thumbnailUrl ? { thumbnailUrl: parsed.thumbnailUrl } : {}),
        ...(parsed.startSec ? { startSec: parsed.startSec } : {}),
        placement: videos.length === 0 ? 'hero' : 'inline',
        caption: '',
        captionKiny: '',
        attribution: '',
        transcript: '',
      },
    ]);
    setDraft('');
    setError('');
    setOpen(id);
  };

  const patch = (id: string, next: Partial<VideoAsset>) =>
    onChange(videos.map((v) => (v.id === id ? { ...v, ...next } : v)));

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= videos.length) return;
    const copy = [...videos];
    [copy[index], copy[to]] = [copy[to]!, copy[index]!];
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-line-2 bg-fill p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Field label={t(A.add)} className="min-w-[14rem] flex-1" hint={t(A.pasteHint)}>
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder={t(A.urlPlaceholder)}
              className="x-input"
              inputMode="url"
            />
          </Field>
          <button type="button" onClick={add} disabled={!draft.trim()} className="x-btn x-btn--primary mb-[18px]">
            <Plus size={14} aria-hidden />
            {t(A.add)}
          </button>
        </div>
        {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
        {draft.trim() && !error && (
          <ParsedPreview raw={draft} invalidLabel={t(A.unsupported)} />
        )}
      </div>

      {videos.length === 0 ? (
        <p className="text-[12px] text-ink/45">{t(A.pasteHint)}</p>
      ) : (
        <ul className="space-y-2">
          {videos.map((v, i) => (
            <li key={v.id} className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-2">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {v.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- provider thumbnail
                  <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] uppercase text-ink/40">{v.provider}</span>
                )}
                {v.placement === 'hero' && (
                  <span className="absolute inset-x-0 bottom-0 bg-brand px-1 text-center text-[9px] font-bold uppercase text-on-brand">hero</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {v.caption || v.title || `${PROVIDER_LABELS[v.provider]}${v.videoId ? ` · ${v.videoId}` : ''}`}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink/45" dir="ltr">
                  {v.url}
                  {v.durationSec ? ` · ${durationLabel(v.durationSec)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-1.5 text-ink/45 hover:bg-fill-2 hover:text-ink disabled:opacity-25" aria-label={t(s.admin.categoriesAdmin.moveUp)}>
                  <ArrowUp size={13} aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === videos.length - 1} className="rounded-md p-1.5 text-ink/45 hover:bg-fill-2 hover:text-ink disabled:opacity-25" aria-label={t(s.admin.categoriesAdmin.moveDown)}>
                  <ArrowDown size={13} aria-hidden />
                </button>
                <button type="button" onClick={() => setOpen(open === v.id ? null : v.id)} className="rounded-md p-1.5 text-ink/45 hover:bg-fill-2 hover:text-ink" aria-label={t(s.admin.preview)}>
                  <Eye size={13} aria-hidden />
                </button>
                <button type="button" onClick={() => onChange(videos.filter((x) => x.id !== v.id))} className="rounded-md p-1.5 text-ink/45 hover:bg-fill-2 hover:text-danger" aria-label={t(A.remove)}>
                  <Trash2 size={13} aria-hidden />
                </button>
              </div>
              {open === v.id && (
                <div className="basis-full border-t border-line pt-2">
                  <VideoDetails v={v} onPatch={(next) => patch(v.id, next)} onInsertToken={onInsertToken ? () => onInsertToken(`{{video:${v.id}}}`) : undefined} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ParsedPreview({ raw, invalidLabel }: { raw: string; invalidLabel: string }) {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return <p className="mt-2 text-[12px] text-warn">{invalidLabel}</p>;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-2 p-2">
      {parsed.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider thumbnail
        <img src={parsed.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover" loading="lazy" />
      ) : (
        <span className="flex h-10 w-16 items-center justify-center rounded bg-fill text-[10px] uppercase text-ink/50">{parsed.provider}</span>
      )}
      <span className="min-w-0 flex-1 truncate text-[12px] text-ink/70" dir="ltr">
        → {parsed.embedUrl}
      </span>
      <span className="x-chip">
        <Sparkles size={10} aria-hidden />
        {PROVIDER_LABELS[parsed.provider]}
      </span>
    </div>
  );
}

function VideoDetails({
  v,
  onPatch,
  onInsertToken,
}: {
  v: VideoAsset;
  onPatch: (p: Partial<VideoAsset>) => void;
  onInsertToken?: () => void;
}) {
  const { t, s } = useLocale();
  const A = s.admin.videos;
  const [preview, setPreview] = useState(false);
  const canFrame = v.provider !== 'x' && v.provider !== 'file' && v.provider !== 'hls';

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label={t(A.caption) + ' (EN)'}>
        <input value={v.caption ?? ''} onChange={(e) => onPatch({ caption: e.target.value })} className="x-input" />
      </Field>
      <Field label={t(A.caption) + ' (RW)'}>
        <input value={v.captionKiny ?? ''} onChange={(e) => onPatch({ captionKiny: e.target.value })} className="x-input" />
      </Field>
      <Field label={t(A.credit)}>
        <input value={v.attribution ?? ''} onChange={(e) => onPatch({ attribution: e.target.value })} className="x-input" placeholder="IbiheNews / AFP…" />
      </Field>
      <Field label={t(A.duration)}>
        <input
          type="number"
          min={0}
          value={v.durationSec ?? ''}
          onChange={(e) => onPatch({ durationSec: e.target.value ? Number(e.target.value) : undefined })}
          className="x-input"
        />
      </Field>
      <Field label={t(A.placement)}>
        <select
          value={v.placement ?? 'inline'}
          onChange={(e) => onPatch({ placement: e.target.value as VideoAsset['placement'] })}
          className="x-input"
        >
          <option value="hero">{t(A.hero)}</option>
          <option value="inline">{t(A.inline)}</option>
          <option value="aside">{t(A.aside)}</option>
        </select>
      </Field>
      <Field label={t(A.startAt)}>
        <input
          type="number"
          min={0}
          value={v.startSec ?? ''}
          onChange={(e) => onPatch({ startSec: e.target.value ? Number(e.target.value) : undefined })}
          className="x-input"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t(A.transcript)}>
          <textarea
            rows={3}
            value={v.transcript ?? ''}
            onChange={(e) => onPatch({ transcript: e.target.value })}
            className="x-input"
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label={t(A.internalNote)}>
          <input value={v.internalNote ?? ''} onChange={(e) => onPatch({ internalNote: e.target.value })} className="x-input" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        {onInsertToken && (
          <button type="button" onClick={onInsertToken} className="x-btn x-btn--ghost x-btn--sm">
            <Plus size={13} aria-hidden />
            {`{{video:${v.id.slice(0, 10)}…}}`}
          </button>
        )}
        {canFrame && (
          <button type="button" onClick={() => setPreview((p) => !p)} className="x-btn x-btn--ghost x-btn--sm">
            <Eye size={13} aria-hidden />
            {t(s.admin.preview)}
          </button>
        )}

      </div>
      {preview && canFrame && (
        <div className="x-video sm:col-span-2">
          <iframe src={v.embedUrl} title={v.caption || v.url} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      )}
    </div>
  );
}
