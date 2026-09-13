'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Eye, Save, Trash2, Undo2 } from 'lucide-react';
import type { Article, Attachment, GalleryImage, NewsCategory, VideoAsset } from '@/types/news';
import type { SourceRef } from '@/types/provenance';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { CATEGORY_SLUGS } from '@/lib/news/category-registry';
import { bodyToPlainText, estimateReadingMinutes } from '@/lib/media/markdown';
import { MediaField, MediaUrlListField } from './MediaField';
import { VideoField } from './VideoField';
import { ErrorNote, Field, Panel, Tabs, Toast, Toggle, useToast } from './ui';

/** Everything the editor holds; mapped to the API body on save. */
export interface Draft {
  id?: string;
  title: string;
  titleKiny: string;
  excerpt: string;
  excerptKiny: string;
  body: string;
  bodyKiny: string;
  category: NewsCategory;
  status: string;
  publishState: 'draft' | 'scheduled' | 'published' | 'archived';
  visibility: 'public' | 'unlisted';
  language: string;
  country: string;
  district: string;
  city: string;
  authorId: string;
  authorName: string;
  slug: string;
  tags: string;
  keyPointsKiny: string;
  keyPointsEn: string;
  imageUrl: string;
  imageAlt: string;
  imageCaption: string;
  imageCaptionKiny: string;
  imageCredit: string;
  videos: VideoAsset[];
  gallery: GalleryImage[];
  attachments: Attachment[];
  audioUrl: string;
  publishedAt: string;
  scheduledAt: string;
  readingMinutes: string;
  featured: boolean;
  breaking: boolean;
  pinned: boolean;
  sponsored: boolean;
  premium: boolean;
  allowComments: boolean;
  factCheck: { rating: string; notes: string; reviewedBy: string };
  seo: { title: string; description: string; keywords: string; ogImageUrl: string; canonicalUrl: string; noindex: boolean };
  localizations: Record<string, { title: string; excerpt: string; body: string }>;
  sources: Array<{ name: string; url: string; authority: string; credibility: string; publishedAt: string; archivedUrl: string; quote: string }>;
}

const STATUSES = ['verified', 'developing', 'multi-source', 'analysis', 'forecast', 'opinion'] as const;
const EXTRA_LOCALES = ['fr', 'sw'] as const;
const RATINGS = ['unverified', 'true', 'mostly-true', 'mixed', 'misleading', 'false', 'outdated'] as const;
const AUTHORITIES = ['', 'primary', 'official', 'wire', 'outlet', 'aggregator', 'social'] as const;

export function emptyDraft(): Draft {
  return {
    title: '',
    titleKiny: '',
    excerpt: '',
    excerptKiny: '',
    body: '',
    bodyKiny: '',
    category: 'amahanga',
    status: 'developing',
    publishState: 'draft',
    visibility: 'public',
    language: 'rw',
    country: 'RW',
    district: '',
    city: '',
    authorId: '',
    authorName: '',
    slug: '',
    tags: '',
    keyPointsKiny: '',
    keyPointsEn: '',
    imageUrl: '',
    imageAlt: '',
    imageCaption: '',
    imageCaptionKiny: '',
    imageCredit: '',
    videos: [],
    gallery: [],
    attachments: [],
    audioUrl: '',
    publishedAt: toLocalInput(new Date().toISOString()),
    scheduledAt: '',
    readingMinutes: '',
    featured: false,
    breaking: false,
    pinned: false,
    sponsored: false,
    premium: false,
    allowComments: true,
    factCheck: { rating: 'unverified', notes: '', reviewedBy: '' },
    seo: { title: '', description: '', keywords: '', ogImageUrl: '', canonicalUrl: '', noindex: false },
    localizations: { fr: { title: '', excerpt: '', body: '' }, sw: { title: '', excerpt: '', body: '' }, ar: { title: '', excerpt: '', body: '' }, ha: { title: '', excerpt: '', body: '' } },
    sources: [{ name: 'Ibihe', url: '', authority: 'outlet', credibility: '', publishedAt: '', archivedUrl: '', quote: '' }],
  };
}

/** ISO ↔ `<input type="datetime-local">` value (no timezone surprises). */
function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

export function draftFromArticle(a: Article): Draft {
  const base = emptyDraft();
  return {
    ...base,
    id: a.id,
    title: a.title ?? '',
    titleKiny: a.titleKiny ?? '',
    excerpt: a.excerpt ?? '',
    excerptKiny: a.excerptKiny ?? '',
    body: a.language === 'en' || !a.localizations?.rw?.body ? (a.body ?? '') : (a.localizations.rw.body ?? ''),
    bodyKiny: a.language === 'rw' ? (a.body ?? '') : (a.localizations?.rw?.body ?? ''),
    category: a.category,
    status: a.status,
    publishState: a.publishState ?? 'published',
    visibility: a.visibility ?? 'public',
    language: a.language ?? 'rw',
    country: a.country ?? 'RW',
    district: a.district ?? '',
    city: a.city ?? '',
    authorId: a.authorId ?? '',
    authorName: a.authorName ?? '',
    slug: a.slug ?? a.seo?.slug ?? '',
    tags: (a.tags ?? []).join(', '),
    keyPointsKiny: (a.keyPointsKiny ?? []).join('\n'),
    keyPointsEn: (a.keyPointsEn ?? []).join('\n'),
    imageUrl: a.imageUrl ?? '',
    imageCaption: a.imageCaption ?? '',
    imageCaptionKiny: a.imageCaptionKiny ?? '',
    imageCredit: a.imageCredit ?? '',
    videos: a.videos ?? [],
    gallery: a.gallery ?? [],
    attachments: a.attachments ?? [],
    audioUrl: a.audioUrl ?? '',
    publishedAt: toLocalInput(a.publishedAt),
    scheduledAt: toLocalInput(a.scheduledAt),
    readingMinutes: a.readingMinutes ? String(a.readingMinutes) : '',
    featured: Boolean(a.featured),
    breaking: Boolean(a.breaking),
    pinned: Boolean(a.pinned),
    sponsored: Boolean(a.sponsored),
    premium: Boolean(a.premium),
    allowComments: a.allowComments !== false,
    factCheck: {
      rating: a.factCheck?.rating ?? 'unverified',
      notes: a.factCheck?.notes ?? '',
      reviewedBy: a.factCheck?.reviewedBy ?? '',
    },
    seo: {
      title: a.seo?.title ?? '',
      description: a.seo?.description ?? '',
      keywords: (a.seo?.keywords ?? []).join(', '),
      ogImageUrl: a.seo?.ogImageUrl ?? '',
      canonicalUrl: a.seo?.canonicalUrl ?? '',
      noindex: Boolean(a.seo?.noindex),
    },
    localizations: {
      ...base.localizations,
      ...Object.fromEntries(
        EXTRA_LOCALES.map((code) => [
          code,
          {
            title: a.localizations?.[code]?.title ?? '',
            excerpt: a.localizations?.[code]?.excerpt ?? '',
            body: a.localizations?.[code]?.body ?? '',
          },
        ]),
      ),
    },
    sources: (a.sources ?? []).map((src: SourceRef) => ({
      name: src.name ?? '',
      url: src.url ?? '',
      authority: src.authority ?? '',
      credibility: src.credibility === undefined ? '' : String(src.credibility),
      publishedAt: src.publishedAt ?? '',
      archivedUrl: src.archivedUrl ?? '',
      quote: src.quote ?? '',
    })),
  };
}

function draftToBody(d: Draft): Record<string, unknown> {
  const localizations = Object.fromEntries(
    Object.entries(d.localizations)
      .map(([code, v]) => [code, { ...(v.title ? { title: v.title } : {}), ...(v.excerpt ? { excerpt: v.excerpt } : {}), ...(v.body ? { body: v.body } : {}) }])
      .filter(([, v]) => Object.keys(v).length > 0),
  );
  const rwBody = d.bodyKiny.trim();
  return {
    title: d.title,
    titleKiny: d.titleKiny,
    excerpt: d.excerpt,
    excerptKiny: d.excerptKiny,
    // The single `body` column holds the language declared below; a Kinyarwanda
    // body lives in localizations.rw so English stays canonical.
    body: d.language === 'rw' && rwBody ? rwBody : d.body,
    language: d.language,
    localizations: {
      ...localizations,
      ...(d.language === 'rw' && rwBody ? {} : rwBody ? { rw: { body: rwBody } } : {}),
    },
    category: d.category,
    status: d.status,
    publishState: d.publishState,
    visibility: d.visibility,
    country: d.country || 'RW',
    district: d.district,
    city: d.city,
    authorId: d.authorId || undefined,
    authorName: d.authorName || undefined,
    slug: d.slug,
    tags: d.tags,
    keyPointsKiny: d.keyPointsKiny.split('\n').map((x) => x.trim()).filter(Boolean),
    keyPointsEn: d.keyPointsEn.split('\n').map((x) => x.trim()).filter(Boolean),
    imageUrl: d.imageUrl,
    imageCaption: d.imageCaption,
    imageCaptionKiny: d.imageCaptionKiny,
    imageCredit: d.imageCredit,
    videos: d.videos,
    gallery: d.gallery,
    attachments: d.attachments,
    audioUrl: d.audioUrl,
    publishedAt: fromLocalInput(d.publishedAt),
    scheduledAt: fromLocalInput(d.scheduledAt),
    readingMinutes: d.readingMinutes ? Number(d.readingMinutes) : undefined,
    featured: d.featured,
    breaking: d.breaking,
    pinned: d.pinned,
    sponsored: d.sponsored,
    premium: d.premium,
    allowComments: d.allowComments,
    factCheck: { rating: d.factCheck.rating, notes: d.factCheck.notes, reviewedBy: d.factCheck.reviewedBy, reviewedAt: new Date().toISOString() },
    seo: {
      title: d.seo.title,
      description: d.seo.description,
      slug: d.slug,
      keywords: d.seo.keywords,
      ogImageUrl: d.seo.ogImageUrl,
      canonicalUrl: d.seo.canonicalUrl,
      noindex: d.seo.noindex,
    },
    sources: d.sources.filter((s) => s.name.trim() || s.url.trim()),
  };
}

interface AuthorOption {
  id: string;
  name: string;
  title: string;
  isActive?: boolean;
}

/**
 * The story editor: content, media (incl. video embeds), every editorial
 * detail, SEO, provenance and the publish controls.
 */
export function ArticleEditor({ article, onDeleted }: { article: Article | null; onDeleted?: () => void }) {
  const { t, s, locale } = useLocale();
  const router = useRouter();
  const A = s.admin;
  const F = s.admin.fields;
  const [draft, setDraft] = useState<Draft>(() => (article ? draftFromArticle(article) : emptyDraft()));
  const [tab, setTab] = useState('content');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState<unknown>(null);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast, show } = useToast();
  const storageKey = `ibihe-draft:${draft.id ?? 'new'}`;

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);
  const setPatch = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  useEffect(() => {
    adminGet<{ items: AuthorOption[] }>('/api/admin/authors')
      .then((data) => setAuthors(data.items.filter((a) => a.isActive !== false)))
      .catch(() => setAuthors([]));
  }, []);

  // Recover an unsaved local draft (browser crash, accidental close).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { at: string; draft: Draft };
      const originalAt = article?.updatedAt ? Date.parse(article.updatedAt) : 0;
      if (Date.parse(saved.at) > originalAt && saved.draft) {
        // A newer local draft than the stored story: restore it once.
        setTimeout(() => {
          setDraft({ ...saved.draft, id: article?.id });
          setDirty(true);
        }, 0);
      }
    } catch {
      /* ignore malformed recovery data */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [article?.id]);

  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ at: new Date().toISOString(), draft }));
      } catch {
        /* storage full — autosave is a nicety, not a requirement */
      }
    }, 4000);
    return () => clearTimeout(id);
  }, [draft, dirty, storageKey]);

  const words = useMemo(() => bodyToPlainText(draft.language === 'rw' ? draft.bodyKiny || draft.body : draft.body).split(/\s+/).filter(Boolean).length, [draft.body, draft.bodyKiny, draft.language]);
  const autoMinutes = useMemo(() => estimateReadingMinutes(draft.body || draft.bodyKiny, draft.excerptKiny || draft.excerpt), [draft.body, draft.bodyKiny, draft.excerpt, draft.excerptKiny]);

  const save = useCallback(
    async (state?: Draft['publishState']) => {
      if (!draft.title.trim() && !draft.titleKiny.trim()) {
        show(locale === 'rw' ? 'Umutwe urakenewe.' : 'A title is required.', 'error');
        setTab('content');
        return;
      }
      setBusy(true);
      try {
        const payload = { ...draftToBody(draft), ...(state ? { publishState: state } : {}) };
        const data = draft.id
          ? await adminSend<{ article: Article }>(`/api/admin/articles/${encodeURIComponent(draft.id)}`, 'PUT', payload)
          : await adminSend<{ article: Article }>('/api/admin/articles', 'POST', payload);
        setDraft(draftFromArticle(data.article));
        setDirty(false);
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
        show(`${t(A.saved)} · ${new Date().toLocaleTimeString()}`, 'ok');
        router.refresh();
      } catch (e) {
        setNotFound(e);
        show(e instanceof Error ? e.message : 'save failed', 'error');
      } finally {
        setBusy(false);
      }
    },
    // The draft is read on demand (save is called from the toolbar / Cmd+S).
    [draft, locale, storageKey, show, router, t, A.saved],
  );

  // Cmd/Ctrl+S saves — journalists live in that shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const remove = async () => {
    if (!draft.id) return;
    if (!window.confirm(t(A.deleteConfirm))) return;
    setBusy(true);
    try {
      await adminSend(`/api/admin/articles/${encodeURIComponent(draft.id)}`, 'DELETE');
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      onDeleted?.();
      router.push('/admin-control/articles');
      router.refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : 'delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const insertToken = (token: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const next = `${el.value.slice(0, start)}\n\n${token}\n\n${el.value.slice(start)}`;
    set('body', next);
    setTab('content');
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length + 3;
    }, 30);
  };

  const previewHref = draft.id ? `/amakuru/${encodeURIComponent(draft.id)}` : '';

  return (
    <div className="space-y-3">
      <div className="x-card sticky top-[3.25rem] z-30 flex flex-wrap items-center gap-2 p-2.5">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[15px] font-bold text-ink">{draft.titleKiny || draft.title || (locale === 'rw' ? 'Inkuru nshya' : 'New story')}</span>
          {dirty && <span className="x-chip !border-warn/40 !text-warn">{t(A.unsaved)}</span>}
        </span>
        <span className="hidden text-[11px] text-ink/45 sm:inline">
          {words} {locale === 'rw' ? 'amagambo' : 'words'} · {draft.readingMinutes || autoMinutes || 0} min
        </span>
        <select
          value={draft.publishState}
          onChange={(e) => set('publishState', e.target.value as Draft['publishState'])}
          className="x-input !w-auto !py-1.5 text-[12px]"
          aria-label={t(F.publishState)}
        >
          <option value="draft">{t(A.state.draft)}</option>
          <option value="scheduled">{t(A.state.scheduled)}</option>
          <option value="published">{t(A.state.published)}</option>
          <option value="archived">{t(A.state.archived)}</option>
        </select>
        {previewHref && (
          <Link href={previewHref} target="_blank" className="x-btn x-btn--ghost x-btn--sm" title={t(A.openStory)}>
            <ExternalLink size={13} aria-hidden />
            <span className="hidden sm:inline">{t(A.preview)}</span>
          </Link>
        )}
        <button type="button" onClick={() => void save()} disabled={busy} className="x-btn x-btn--primary x-btn--sm">
          {busy ? '…' : <Save size={13} aria-hidden />}
          {t(A.saveAll)}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setDraft(article ? draftFromArticle(article) : emptyDraft());
              setDirty(false);
            }}
            className="x-btn x-btn--ghost x-btn--sm"
            title={t(A.discard)}
          >
            <Undo2 size={13} aria-hidden />
          </button>
        )}
        {draft.id && (
          <button type="button" onClick={() => void remove()} disabled={busy} className="x-btn x-btn--danger x-btn--sm" aria-label={t(A.deleteArticle)}>
            <Trash2 size={13} aria-hidden />
          </button>
        )}
      </div>

      {notFound ? <ErrorNote error={notFound} onRetry={() => setNotFound(null)} /> : null}
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'content', label: t(A.tabs.content) },
          { id: 'media', label: t(A.tabs.media), badge: draft.videos.length + draft.gallery.length },
          { id: 'details', label: t(A.tabs.details) },
          { id: 'seo', label: t(A.tabs.seo) },
          { id: 'sources', label: t(A.tabs.sources), badge: draft.sources.length },
          { id: 'translate', label: t(s.common.language), badge: Object.values(draft.localizations).filter((l) => l.title || l.body).length },
        ]}
      />

      {tab === 'content' && (
        <Panel title={t(A.tabs.content)}>
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label={t(F.titleEn)} required>
                <input value={draft.title} onChange={(e) => setPatch({ title: e.target.value, titleKiny: draft.titleKiny || e.target.value })} className="x-input" dir="auto" />
              </Field>
              <Field label={t(F.titleKiny)}>
                <input value={draft.titleKiny} onChange={(e) => set('titleKiny', e.target.value)} className="x-input" dir="auto" />
              </Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label={`${t(F.excerpt)} (EN)`} required hint={locale === 'rw' ? 'Umurongo 1–3: incamake igaragara ku rutonde.' : 'Shown on cards, search results and social previews.'}>
                <textarea rows={3} value={draft.excerpt} onChange={(e) => set('excerpt', e.target.value)} className="x-input" dir="auto" />
              </Field>
              <Field label={`${t(F.excerpt)} (RW)`}>
                <textarea rows={3} value={draft.excerptKiny} onChange={(e) => set('excerptKiny', e.target.value)} className="x-input" dir="auto" />
              </Field>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Field
                label={`${t(F.body)} (EN)`}
                hint={t(F.bodyHelp)}
              >
                <textarea
                  ref={bodyRef}
                  rows={14}
                  value={draft.body}
                  onChange={(e) => set('body', e.target.value)}
                  className="x-input font-mono !text-[13px]"
                  dir="auto"
                />
              </Field>
              <Field label={`${t(F.body)} (RW)`} hint={t(F.bodyHelp)}>
                <textarea rows={14} value={draft.bodyKiny} onChange={(e) => set('bodyKiny', e.target.value)} className="x-input font-mono !text-[13px]" dir="auto" />
              </Field>
            </div>

            <details className="rounded-xl border border-line bg-fill p-3" open={!draft.body && !draft.bodyKiny ? false : undefined}>
              <summary className="cursor-pointer text-[13px] font-semibold text-ink/70">{t(A.tabs.content)} — preview</summary>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="x-prose !text-[14px]">
                  <p className="whitespace-pre-line">{draft.body || <em>—</em>}</p>
                </div>
                <div className="x-prose !text-[14px]" dir="auto">
                  <p className="whitespace-pre-line">{draft.bodyKiny || <em>—</em>}</p>
                </div>
              </div>
            </details>

            <div className="grid gap-3 lg:grid-cols-2">
              <Field label={t(s.form.keyPoints)} hint={locale === 'rw' ? 'Umurongo umwe ku ngingo imwe.' : 'One bullet per line (max 8).'}>
                <textarea rows={4} value={draft.keyPointsKiny} onChange={(e) => set('keyPointsKiny', e.target.value)} className="x-input" dir="auto" />
              </Field>
              <Field label={t(s.form.keyPointsEn)}>
                <textarea rows={4} value={draft.keyPointsEn} onChange={(e) => set('keyPointsEn', e.target.value)} className="x-input" dir="auto" />
              </Field>
            </div>
            <Field label={t(F.tagsLabel)}>
              <input value={draft.tags} onChange={(e) => set('tags', e.target.value)} className="x-input" placeholder="isoko, kigali, ibirayi" />
            </Field>
          </div>
        </Panel>
      )}

      {tab === 'media' && (
        <div className="space-y-3">
          <Panel title={t(A.videos.title)} subtitle={`${draft.videos.length} · ${draft.videos.reduce((n, v) => n + (v.durationSec ?? 0), 0)}s`}>
            <VideoField videos={draft.videos} onChange={(v) => set('videos', v)} onInsertToken={insertToken} />
            {draft.videos.length > 0 && (
              <p className="mt-3 text-[11px] text-ink/45">
                {locale === 'rw' ? 'Video ya mbere ifite “hero” igaragara hejuru y’inkuru; izindi zishyirwa mu nyuguti na {{video:id}}.' : 'The clip marked “hero” plays above the headline; others sit in the text via {{video:id}}.'}
              </p>
            )}
          </Panel>
          <Panel title={t(F.heroImage)}>
            <div className="grid gap-3 lg:grid-cols-2">
              <MediaField label={t(F.heroImage)} value={draft.imageUrl} onChange={(v) => set('imageUrl', v)} alt={draft.imageAlt} onAltChange={(v) => set('imageAlt', v)} />
              <div className="space-y-3">
                <Field label={`${t(s.admin.media.caption)} (EN)`}>
                  <input value={draft.imageCaption} onChange={(e) => set('imageCaption', e.target.value)} className="x-input" />
                </Field>
                <Field label={`${t(s.admin.media.caption)} (RW)`}>
                  <input value={draft.imageCaptionKiny} onChange={(e) => set('imageCaptionKiny', e.target.value)} className="x-input" />
                </Field>
                <Field label={t(s.admin.videos.credit)}>
                  <input value={draft.imageCredit} onChange={(e) => set('imageCredit', e.target.value)} className="x-input" placeholder="© IbiheNews" />
                </Field>
              </div>
            </div>
          </Panel>
          <Panel title={t(s.article.gallery)}>
            <GalleryEditor value={draft.gallery} onChange={(v) => set('gallery', v)} />
          </Panel>
          <Panel title={t(s.article.attachments)}>
            <AttachmentsEditor value={draft.attachments} onChange={(v) => set('attachments', v)} />
          </Panel>
          <Panel title={locale === "rw" ? "Amajwi" : "Audio"}>
            <Field label="Audio narration URL" hint={locale === 'rw' ? 'Ifoto y’ijwi (mp3) isomwa n’umunyamakuru.' : 'Optional spoken version of the story (mp3).'}>
              <input value={draft.audioUrl} onChange={(e) => set('audioUrl', e.target.value)} className="x-input" placeholder="https://…/article.mp3" />
            </Field>
          </Panel>
        </div>
      )}

      {tab === 'details' && (
        <div className="space-y-3">
          <Panel title={t(A.tabs.details)}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t(F.category)}>
                <select value={draft.category} onChange={(e) => set('category', e.target.value as NewsCategory)} className="x-input">
                  {CATEGORY_SLUGS.map((c) => (
                    <option key={c} value={c}>
                      {(s.categories as Record<string, { rw: string; en: string }>)[c]?.[locale === 'rw' ? 'rw' : 'en'] ?? c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(F.status)}>
                <select value={draft.status} onChange={(e) => set('status', e.target.value)} className="x-input">
                  {STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {t(s.status[v])}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(F.author)}>
                <select
                  value={draft.authorId}
                  onChange={(e) => {
                    const found = authors.find((a) => a.id === e.target.value);
                    setPatch({ authorId: e.target.value, authorName: found?.name ?? '' });
                  }}
                  className="x-input"
                >
                  <option value="">{t(s.form.noAuthor)}</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(F.country)}>
                <select value={draft.country} onChange={(e) => set('country', e.target.value)} className="x-input">
                  {['RW', 'KE', 'UG', 'TZ', 'BI', 'CD', 'NG', 'ET', 'GH', 'ZA', 'US', 'FR', 'GB'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(F.district)}>
                <input value={draft.district} onChange={(e) => set('district', e.target.value)} className="x-input" placeholder="Gasabo" list="ibihe-districts" />
              </Field>
              <Field label={t(F.city)}>
                <input value={draft.city} onChange={(e) => set('city', e.target.value)} className="x-input" placeholder="Kigali" />
              </Field>
              <Field label={t(F.language)}>
                <select value={draft.language} onChange={(e) => set('language', e.target.value)} className="x-input">
                  {['rw', 'en', 'fr', 'sw'].map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(F.readingTime)} hint={locale === 'rw' ? 'Nta waxe: tubara ku 190 words/min.' : 'Leave empty to compute from the body.'}>
                <input type="number" min={0} max={600} value={draft.readingMinutes} onChange={(e) => set('readingMinutes', e.target.value)} className="x-input" placeholder={String(autoMinutes || '')} />
              </Field>
              <Field label={t(F.slug)} hint="/amakuru/…">
                <input value={draft.slug} onChange={(e) => set('slug', e.target.value)} className="x-input" dir="ltr" placeholder="kigali-maize-prices" />
              </Field>
              <Field label={t(F.publishAt)}>
                <input type="datetime-local" value={draft.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} className="x-input" />
              </Field>
              <Field label={t(A.state.scheduled)} hint={t(F.scheduleHelp)}>
                <input type="datetime-local" value={draft.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} className="x-input" />
              </Field>
            </div>
            <datalist id="ibihe-districts">
              {['Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Kamonyi', 'Rulindo', 'Rubavu', 'Nyabihu', 'Huye', 'Musanze'].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Panel>

          <Panel title={t(A.fields.featured)}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Toggle checked={draft.featured} onChange={(v) => set('featured', v)} label={t(A.fields.featured)} />
              <Toggle checked={draft.breaking} onChange={(v) => set('breaking', v)} label={t(A.fields.breaking)} />
              <Toggle checked={draft.pinned} onChange={(v) => set('pinned', v)} label={t(A.fields.pinned)} />
              <Toggle checked={draft.sponsored} onChange={(v) => set('sponsored', v)} label={t(A.fields.sponsored)} />
              <Toggle checked={draft.premium} onChange={(v) => set('premium', v)} label={t(A.fields.premium)} />
              <Toggle checked={draft.allowComments} onChange={(v) => set('allowComments', v)} label={t(A.fields.allowComments)} />
            </div>
          </Panel>

          <Panel title={t(A.fields.factCheck)}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t(A.fields.rating)}>
                <select value={draft.factCheck.rating} onChange={(e) => set('factCheck', { ...draft.factCheck, rating: e.target.value })} className="x-input">
                  {RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(A.fields.reviewedBy)}>
                <input value={draft.factCheck.reviewedBy} onChange={(e) => set('factCheck', { ...draft.factCheck, reviewedBy: e.target.value })} className="x-input" />
              </Field>
              <Field label={t(A.fields.notes)} className="sm:col-span-1 lg:col-span-1">
                <input value={draft.factCheck.notes} onChange={(e) => set('factCheck', { ...draft.factCheck, notes: e.target.value })} className="x-input" />
              </Field>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'seo' && (
        <div className="space-y-3">
          <Panel title={t(A.settingsAdmin.seoDefaults)}>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label={t(A.fields.metaTitle)} hint={`${draft.seo.title.length || (draft.titleKiny || draft.title).length}/60`}>
                <input value={draft.seo.title} onChange={(e) => set('seo', { ...draft.seo, title: e.target.value })} className="x-input" placeholder={draft.titleKiny || draft.title} />
              </Field>
              <Field label={t(A.fields.slug)}>
                <input value={draft.slug} onChange={(e) => set('slug', e.target.value)} className="x-input" dir="ltr" />
              </Field>
              <Field label={t(A.fields.metaDescription)} hint={`${(draft.seo.description || draft.excerpt).length}/160`}>
                <textarea rows={2} value={draft.seo.description} onChange={(e) => set('seo', { ...draft.seo, description: e.target.value })} className="x-input" placeholder={draft.excerpt} />
              </Field>
              <Field label={t(A.fields.keywords)}>
                <input value={draft.seo.keywords} onChange={(e) => set('seo', { ...draft.seo, keywords: e.target.value })} className="x-input" placeholder="maize, prices, kigali" />
              </Field>
              <Field label={t(A.fields.canonical)}>
                <input value={draft.seo.canonicalUrl} onChange={(e) => set('seo', { ...draft.seo, canonicalUrl: e.target.value })} className="x-input" dir="ltr" placeholder="https://…" />
              </Field>
              <MediaField label={t(A.fields.ogImage)} value={draft.seo.ogImageUrl} onChange={(v) => set('seo', { ...draft.seo, ogImageUrl: v })} />
              <Toggle checked={draft.seo.noindex} onChange={(v) => set('seo', { ...draft.seo, noindex: v })} label={t(A.fields.noindex)} />
            </div>
          </Panel>
          <Panel title={t(A.preview)}>
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-[11px] text-ink/45" dir="ltr">
                  {draft.seo.canonicalUrl || 'https://ibihenews.rw'} › amakuru › {draft.slug || '…'}
                </p>
                <p className="mt-1 text-[17px] leading-snug text-[#1a0dab]">{draft.seo.title || draft.titleKiny || draft.title || '—'}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink/60 x-clamp-2">{draft.seo.description || draft.excerptKiny || draft.excerpt || '—'}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="bg-fill px-3 py-2 text-[11px] uppercase tracking-wide text-ink/45">Facebook / X card</div>
                {draft.seo.ogImageUrl || draft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- social preview
                  <img src={draft.seo.ogImageUrl || draft.imageUrl} alt="" className="aspect-[1.91/1] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[1.91/1] items-center justify-center bg-surface-2 text-[12px] text-ink/40">{locale === 'rw' ? 'Nta hoto' : 'No image'}</div>
                )}
                <div className="px-3 py-2">
                  <p className="truncate text-[13px] font-semibold text-ink">{draft.seo.title || draft.titleKiny || draft.title || '—'}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-ink/55">{draft.seo.description || draft.excerpt || ''}</p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'sources' && (
        <Panel title={t(A.tabs.sources)} subtitle={locale === 'rw' ? 'Inkomoko zerekana ukuri kw’inkuru.' : 'Every claim should point at something real.'}>
          <div className="space-y-2">
            {draft.sources.map((src, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-line bg-fill p-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t(s.form.sourceName)}>
                  <input value={src.name} onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="x-input" placeholder="Kigali Today" />
                </Field>
                <Field label={t(s.form.sourceUrl)}>
                  <input value={src.url} onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className="x-input" dir="ltr" placeholder="https://…" />
                </Field>
                <Field label="authority">
                  <select value={src.authority} onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, authority: e.target.value } : x)))} className="x-input">
                    {AUTHORITIES.map((a) => (
                      <option key={a} value={a}>
                        {a || '—'}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="credibility 0–1">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={1}
                    value={src.credibility}
                    onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, credibility: e.target.value } : x)))}
                    className="x-input"
                  />
                </Field>
                <Field label="archive url" className="lg:col-span-2">
                  <input value={src.archivedUrl} onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, archivedUrl: e.target.value } : x)))} className="x-input" dir="ltr" placeholder="https://web.archive.org/…" />
                </Field>
                <Field label={locale === "rw" ? "igika cy’ivugo (quote)" : "quote"} className="lg:col-span-2">
                  <input value={src.quote} onChange={(e) => set('sources', draft.sources.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))} className="x-input" />
                </Field>
                <div className="flex items-end justify-end lg:col-span-4">
                  <button
                    type="button"
                    onClick={() => set('sources', draft.sources.filter((_, j) => j !== i))}
                    className="x-btn x-btn--ghost x-btn--sm"
                    aria-label={t(s.admin.videos.remove)}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set('sources', [...draft.sources, { name: '', url: '', authority: 'outlet', credibility: '', publishedAt: '', archivedUrl: '', quote: '' }])}
              className="x-btn x-btn--ghost x-btn--sm"
            >
              + {t(A.newStory)}
            </button>
          </div>
        </Panel>
      )}

      {tab === 'translate' && (
        <Panel title={t(s.common.language)} subtitle={locale === 'rw' ? 'Indimi 6 z’urubuga: andika aho ushaka.' : 'Optional versions for fr / sw / ar / ha readers.'}>
          <div className="space-y-3">
            {EXTRA_LOCALES.map((code) => {
              const val = draft.localizations[code] ?? { title: '', excerpt: '', body: '' };
              const dir = 'ltr';
              return (
                <details key={code} className="rounded-xl border border-line bg-fill p-3" open={Boolean(val.title)}>
                  <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink/80">
                    <span className="x-chip !py-0">{code.toUpperCase()}</span>
                    {val.title && <span className="min-w-0 flex-1 truncate text-ink/55">{val.title}</span>}
                    {!val.title && <span className="min-w-0 flex-1 truncate text-ink/35">{locale === 'rw' ? 'ntacyanditswe' : 'not written yet'}</span>}
                    <Eye size={13} className="text-ink/30" aria-hidden />
                  </summary>
                  <div className="mt-3 space-y-2" dir={dir}>
                    <Field label="Title">
                      <input value={val.title} onChange={(e) => set('localizations', { ...draft.localizations, [code]: { ...val, title: e.target.value } })} className="x-input" />
                    </Field>
                    <Field label="Excerpt">
                      <textarea rows={2} value={val.excerpt} onChange={(e) => set('localizations', { ...draft.localizations, [code]: { ...val, excerpt: e.target.value } })} className="x-input" />
                    </Field>
                    <Field label="Body">
                      <textarea rows={6} value={val.body} onChange={(e) => set('localizations', { ...draft.localizations, [code]: { ...val, body: e.target.value } })} className="x-input font-mono !text-[13px]" />
                    </Field>
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

    </div>
  );
}

/** Gallery rows: url + 2 captions + credit, reordered in place. */
function GalleryEditor({ value, onChange }: { value: GalleryImage[]; onChange: (v: GalleryImage[]) => void }) {
  const { t, s } = useLocale();
  return (
    <div className="space-y-2">
      <MediaUrlListField label={t(s.article.gallery)} items={value.map((g) => ({ url: g.url }))} onChange={(items) => onChange(items.map((it, i) => ({ ...value[i], url: it.url })))} />
      {value.map((g, i) => (
        <div key={g.url + i} className="grid gap-2 rounded-xl border border-line bg-fill p-2.5 sm:grid-cols-3">
          <Field label="caption (EN)">
            <input value={g.caption ?? ''} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} className="x-input" />
          </Field>
          <Field label="caption (RW)">
            <input value={g.captionKiny ?? ''} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, captionKiny: e.target.value } : x)))} className="x-input" />
          </Field>
          <Field label={t(s.admin.videos.credit)}>
            <input value={g.credit ?? ''} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, credit: e.target.value } : x)))} className="x-input" />
          </Field>
        </div>
      ))}
    </div>
  );
}

/** Attachments (documents) with name + size. */
function AttachmentsEditor({ value, onChange }: { value: Attachment[]; onChange: (v: Attachment[]) => void }) {
  const { t, s } = useLocale();
  return (
    <div className="space-y-2">
      <MediaUrlListField
        label={t(s.article.attachments)}
        kind="document"
        items={value.map((a) => ({ url: a.url }))}
        onChange={(items) => onChange(items.map((it, i) => ({ id: value[i]?.id ?? `att-${i}`, name: value[i]?.name ?? it.url.split('/').pop() ?? 'document', url: it.url, mime: value[i]?.mime })))}
      />
      {value.map((a, i) => (
        <div key={a.id} className="grid gap-2 sm:grid-cols-3">
          <Field label={t(s.admin.authorsAdmin.name)}>
            <input value={a.name} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="x-input" />
          </Field>
          <Field label="mime">
            <input value={a.mime ?? ''} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, mime: e.target.value } : x)))} className="x-input" placeholder="application/pdf" />
          </Field>
          <Field label={t(s.article.download)}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={a.sizeKb ?? ''}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, sizeKb: e.target.value ? Number(e.target.value) : undefined } : x)))}
                className="x-input"
                placeholder="KB"
              />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="x-btn x-btn--ghost x-btn--icon" aria-label={t(s.admin.media.delete)}>
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          </Field>
        </div>
      ))}
    </div>
  );
}
