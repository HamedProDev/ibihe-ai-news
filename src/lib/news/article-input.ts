/**
 * Editorial article input → validated Article document.
 *
 * Both the admin create and update endpoints funnel through here so a story
 * saved from the console always carries: normalized videos (embed URLs rebuilt
 * by the provider whitelist), trimmed text fields, slug, tags, localizations,
 * SEO block, fact-check verdict, computed reading time and workflow state.
 */
import type {
  Article, ArticleSeo, Attachment, FactCheckRating, GalleryImage,
  LangCode, LocalizedStory, NewsCategory, PublishState, VideoAsset, Visibility,
} from '../../types/news';
import type { ContentStatus, SourceRef } from '../../types/provenance';
import { CATEGORY_ALIASES, CATEGORY_SLUGS, canonicalCategory } from '../news/category-registry.ts';
import { normalizeVideos } from '../media/video.ts';
import { estimateReadingMinutes } from '../media/markdown.ts';

/** Slug or alias — both accepted on write, stored canonical. */
export function isValidCategory(v: unknown): v is string {
  const s = typeof v === 'string' ? v.toLowerCase() : '';
  return (CATEGORY_SLUGS as string[]).includes(s) || s in CATEGORY_ALIASES;
}
export const STATUS_SET = new Set<string>(['verified', 'developing', 'multi-source', 'analysis', 'forecast', 'opinion']);
export const PUBLISH_STATES = new Set<string>(['draft', 'scheduled', 'published', 'archived']);
export const VISIBILITIES = new Set<string>(['public', 'unlisted']);
const LOCALES = new Set<string>(['rw', 'en', 'fr', 'sw']);
const RATINGS = new Set<string>(['unverified', 'true', 'mostly-true', 'mixed', 'misleading', 'false', 'outdated']);
const AUTHORITIES = new Set(['primary', 'official', 'wire', 'outlet', 'aggregator', 'social']);

export interface ArticleInputError {
  code: string;
  messageKiny: string;
  messageEn: string;
}

export interface ArticleInputResult {
  errors: ArticleInputError[];
  patch: Partial<Article>;
}

type Body = Record<string, unknown>;

const str = (v: unknown, max = 4000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const optStr = (v: unknown, max = 4000): string | undefined => {
  const s = str(v, max);
  return s || undefined;
};
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
const int = (v: unknown, min = 0, max = 1_000_000): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : undefined;
};
const isoDate = (v: unknown): string | undefined => {
  const s = str(v, 40);
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
};

/** https URL (or a site-relative path) or nothing. */
function urlOr(v: unknown, max = 1000): string | undefined {
  const s = str(v, max);
  if (!s) return undefined;
  if (s.startsWith('/')) return s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function parseTags(v: unknown): string[] {
  const raw = Array.isArray(v)
    ? v.map((x) => str(x, 40))
    : str(v, 800)
        .split(',')
        .map((x) => x.trim());
  const out: string[] = [];
  for (const t of raw) {
    const clean = t.replace(/^#/, '').toLowerCase();
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= 20) break;
  }
  return out;
}

function parseVideos(v: unknown): VideoAsset[] | undefined {
  if (v === undefined) return undefined;
  return normalizeVideos(v);
}

function parseGallery(v: unknown): GalleryImage[] | undefined {
  if (!Array.isArray(v)) return v === undefined ? undefined : [];
  const out: GalleryImage[] = [];
  for (const raw of v.slice(0, 30)) {
    if (!raw || typeof raw !== 'object') continue;
    const g = raw as Body;
    const url = urlOr(g.url);
    if (!url) continue;
    out.push({
      url,
      ...(optStr(g.alt, 200) ? { alt: optStr(g.alt, 200) } : {}),
      ...(optStr(g.caption, 400) ? { caption: optStr(g.caption, 400) } : {}),
      ...(optStr(g.captionKiny, 400) ? { captionKiny: optStr(g.captionKiny, 400) } : {}),
      ...(optStr(g.credit, 120) ? { credit: optStr(g.credit, 120) } : {}),
    });
  }
  return out;
}

function parseAttachments(v: unknown): Attachment[] | undefined {
  if (!Array.isArray(v)) return v === undefined ? undefined : [];
  const out: Attachment[] = [];
  for (const [i, raw] of v.slice(0, 12).entries()) {
    if (!raw || typeof raw !== 'object') continue;
    const a = raw as Body;
    const url = urlOr(a.url);
    const name = str(a.name, 160);
    if (!url || !name) continue;
    out.push({
      id: str(a.id, 40) || `att-${i + 1}`,
      name,
      url,
      ...(optStr(a.mime, 80) ? { mime: optStr(a.mime, 80) } : {}),
      ...(int(a.sizeKb) !== undefined ? { sizeKb: int(a.sizeKb) } : {}),
    });
  }
  return out;
}

function parseLocalizations(v: unknown): Article['localizations'] | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const out: NonNullable<Article['localizations']> = {};
  for (const [code, raw] of Object.entries(v as Body)) {
    if (!LOCALES.has(code) || !raw || typeof raw !== 'object') continue;
    const loc = raw as Body;
    const entry: LocalizedStory = {};
    const title = optStr(loc.title, 300);
    const excerpt = optStr(loc.excerpt, 2000);
    const body = optStr(loc.body, 30_000);
    if (title) entry.title = title;
    if (excerpt) entry.excerpt = excerpt;
    if (body) entry.body = body;
    if (Object.keys(entry).length) out[code as LangCode] = entry;
  }
  return Object.keys(out).length ? out : {};
}

function parseSeo(v: unknown): ArticleSeo | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const s = v as Body;
  const out: ArticleSeo = {};
  const slug = slugify(str(s.slug, 90));
  if (slug) out.slug = slug;
  const title = optStr(s.title, 160);
  if (title) out.title = title;
  const desc = optStr(s.description, 300);
  if (desc) out.description = desc;
  const og = urlOr(s.ogImageUrl);
  if (og) out.ogImageUrl = og;
  const canonical = urlOr(s.canonicalUrl);
  if (canonical) out.canonicalUrl = canonical;
  const noindex = bool(s.noindex);
  if (noindex !== undefined) out.noindex = noindex;
  const keywords = Array.isArray(s.keywords)
    ? (s.keywords as unknown[]).map((k) => str(k, 60)).filter(Boolean).slice(0, 12)
    : str(s.keywords, 600).split(',').map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 12);
  if (keywords.length) out.keywords = keywords;
  return out;
}

function parseFactCheck(v: unknown): Article['factCheck'] | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const f = v as Body;
  const rating = str(f.rating, 24);
  if (!rating) return { rating: 'unverified' };
  return {
    rating: (RATINGS.has(rating) ? rating : 'unverified') as FactCheckRating,
    ...(optStr(f.notes, 2000) ? { notes: optStr(f.notes, 2000) } : {}),
    ...(optStr(f.reviewedBy, 120) ? { reviewedBy: optStr(f.reviewedBy, 120) } : {}),
    ...(isoDate(f.reviewedAt) ? { reviewedAt: isoDate(f.reviewedAt) } : {}),
  };
}

function parseSources(v: unknown): SourceRef[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const now = new Date().toISOString();
  const out: SourceRef[] = [];
  for (const raw of v.slice(0, 12)) {
    if (!raw || typeof raw !== 'object') continue;
    const s = raw as Body;
    const name = str(s.name, 160);
    const url = urlOr(s.url) ?? str(s.url, 400);
    if (!name && !url) continue;
    const authority = str(s.authority, 20);
    const credibility = Number(s.credibility);
    out.push({
      name: name || 'Source',
      url: url || 'https://ibihe.rw',
      fetchedAt: isoDate(s.fetchedAt) ?? now,
      ...(isoDate(s.publishedAt) ? { publishedAt: isoDate(s.publishedAt) } : {}),
      ...(optStr(s.language, 8) ? { language: optStr(s.language, 8) } : {}),
      ...(AUTHORITIES.has(authority) ? { authority: authority as SourceRef['authority'] } : {}),
      ...(Number.isFinite(credibility) ? { credibility: Math.min(1, Math.max(0, credibility)) } : {}),
      ...(optStr(s.archivedUrl, 800) ? { archivedUrl: optStr(s.archivedUrl, 800) } : {}),
      ...(optStr(s.quote, 2000) ? { quote: optStr(s.quote, 2000) } : {}),
      ...(optStr(s.addedBy, 80) ? { addedBy: optStr(s.addedBy, 80) } : {}),
    });
  }
  return out;
}

/** Key points: array of lines, max 8, trimmed. */
function parseKeyPoints(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  const lines = Array.isArray(v) ? v.map((x) => str(x, 500)) : str(v, 4000).split('\n').map((x) => x.trim());
  return lines.filter(Boolean).slice(0, 8);
}

/**
 * Build the patch for POST/PUT. `mode='create'` fills defaults and validates
 * required fields; `mode='update'` only touches provided keys.
 */
export function buildArticlePatch(body: Body, mode: 'create' | 'update'): ArticleInputResult {
  const errors: ArticleInputError[] = [];
  const patch: Partial<Article> = {};

  const title = optStr(body.title, 300);
  if (title !== undefined) patch.title = title;

  const titleKiny = str(body.titleKiny, 300);
  if (titleKiny) patch.titleKiny = titleKiny;
  else if (title) patch.titleKiny = title;

  const excerptVal = optStr(body.excerpt, 2000);
  if (excerptVal !== undefined) patch.excerpt = excerptVal;
  const excerptKiny = str(body.excerptKiny, 2000);
  if (excerptKiny) patch.excerptKiny = excerptKiny;
  else if (excerptVal) patch.excerptKiny = excerptVal;

  if (body.body !== undefined) {
    const content = str(body.body, 30_000);
    patch.body = content || '';
  }
  if (body.bodyKiny !== undefined) {
    const kiny = str(body.bodyKiny, 30_000);
    patch.localizations = { ...(patch.localizations ?? {}), rw: { ...(patch.localizations?.rw ?? {}), body: kiny } };
  }

  if (body.category !== undefined) {
    const cat = str(body.category, 30);
    if (isValidCategory(cat)) patch.category = canonicalCategory(cat) as NewsCategory;
    else errors.push({ code: 'bad-category', messageKiny: 'Icyiciro ntago aribyo.', messageEn: 'Invalid category.' });
  }
  if (body.status !== undefined) {
    const st = str(body.status, 30);
    if (STATUS_SET.has(st)) patch.status = st as ContentStatus;
    else errors.push({ code: 'bad-status', messageKiny: 'Imiterere ntago ariyo.', messageEn: 'Invalid status.' });
  }
  if (body.publishState !== undefined) {
    const ps = str(body.publishState, 20);
    if (PUBLISH_STATES.has(ps)) patch.publishState = ps as PublishState;
    else errors.push({ code: 'bad-state', messageKiny: 'Imimerere ntago ariyo.', messageEn: 'Invalid publish state.' });
  }
  if (body.visibility !== undefined) {
    const vis = str(body.visibility, 20);
    if (VISIBILITIES.has(vis)) patch.visibility = vis as Visibility;
  }

  if (body.imageUrl !== undefined) {
    const img = urlOr(body.imageUrl);
    const raw = str(body.imageUrl, 1000);
    if (!raw) patch.imageUrl = undefined;
    else if (img) patch.imageUrl = img;
    else errors.push({ code: 'bad-image', messageKiny: 'Ifoto igomba kuba URL ya HTTPS cyangwa URL y’imbere.', messageEn: 'Image must be an https URL or an internal /api/media path.' });
  }
  const imageCaption = optStr(body.imageCaption, 400);
  if (imageCaption !== undefined) patch.imageCaption = imageCaption;
  const imageCaptionKiny = optStr(body.imageCaptionKiny, 400);
  if (imageCaptionKiny !== undefined) patch.imageCaptionKiny = imageCaptionKiny;
  const imageCredit = optStr(body.imageCredit, 160);
  if (imageCredit !== undefined) patch.imageCredit = imageCredit;

  const videos = parseVideos(body.videos);
  if (videos !== undefined) patch.videos = videos;
  const gallery = parseGallery(body.gallery);
  if (gallery !== undefined) patch.gallery = gallery;
  const attachments = parseAttachments(body.attachments);
  if (attachments !== undefined) patch.attachments = attachments;
  const audio = urlOr(body.audioUrl);
  if (body.audioUrl !== undefined) patch.audioUrl = audio ?? (str(body.audioUrl) ? undefined : '');

  if (body.keyPointsKiny !== undefined) patch.keyPointsKiny = parseKeyPoints(body.keyPointsKiny) ?? [];
  if (body.keyPointsEn !== undefined) patch.keyPointsEn = parseKeyPoints(body.keyPointsEn) ?? [];

  const tags = parseTags(body.tags);
  if (body.tags !== undefined || mode === 'create') patch.tags = tags;

  const locs = parseLocalizations(body.localizations);
  if (locs !== undefined) patch.localizations = { ...(patch.localizations ?? {}), ...locs };

  const seo = parseSeo(body.seo);
  if (seo !== undefined) patch.seo = Object.keys(patch.localizations ?? {}).length ? seo : seo;
  if (body.slug !== undefined || body.seo !== undefined || (mode === 'create' && patch.title)) {
    const explicit = slugify(str(body.slug, 90)) || slugify(seo?.slug ?? '');
    patch.slug = explicit || slugify(patch.title ?? '') || undefined;
  }
  if (body.country !== undefined) patch.country = (str(body.country, 2) || 'RW').toUpperCase();
  const district = optStr(body.district, 60);
  if (district !== undefined) patch.district = district;
  const city = optStr(body.city, 60);
  if (city !== undefined) patch.city = city;
  if (body.language !== undefined) {
    const lang = str(body.language, 4);
    patch.language = (LOCALES.has(lang) ? lang : 'rw') as LangCode;
  }

  const authorId = optStr(body.authorId, 60);
  if (authorId !== undefined) {
    patch.authorId = authorId;
    patch.authorName = optStr(body.authorName, 120);
    if (body.authorName === undefined) delete (patch as Record<string, unknown>).authorName;
  } else if (optStr(body.authorName, 120)) {
    patch.authorName = optStr(body.authorName, 120);
  }

  const publishedAt = isoDate(body.publishedAt);
  if (publishedAt) patch.publishedAt = publishedAt;
  const scheduledAt = isoDate(body.scheduledAt);
  if (scheduledAt !== undefined) patch.scheduledAt = scheduledAt;
  const updatedAt = isoDate(body.updatedAt);
  if (updatedAt) patch.updatedAt = updatedAt;

  for (const key of ['featured', 'breaking', 'pinned', 'sponsored', 'premium', 'allowComments'] as const) {
    const v = bool(body[key]);
    if (v !== undefined) patch[key] = v;
  }
  if (body.factCheck !== undefined) patch.factCheck = parseFactCheck(body.factCheck);
  const sources = parseSources(body.sources);
  if (sources !== undefined) patch.sources = sources;
  if (body.sourceName !== undefined || body.sourceUrl !== undefined) {
    const name = str(body.sourceName, 120) || 'Ibihe';
    const url = urlOr(body.sourceUrl) ?? 'https://ibihe.rw';
    const nowIso = new Date().toISOString();
    patch.sources = [{ name, url, publishedAt: publishedAt ?? nowIso, fetchedAt: nowIso, authority: 'outlet', addedBy: str(body.actor, 80) || undefined }];
  }
  const manualReading = int(body.readingMinutes, 0, 600);
  if (manualReading !== undefined) patch.readingMinutes = manualReading;

  // Reading time is derived from the body, never hand-typed unless given.
  if (patch.body !== undefined || patch.title || patch.excerpt) {
    const minutes =
      manualReading ??
      estimateReadingMinutes(patch.body ?? '', patch.excerptKiny ?? (patch as { excerpt?: string }).excerpt ?? '');
    if (minutes > 0) patch.readingMinutes = minutes;
  }

  if (mode === 'create') {
    if (!patch.title) errors.push({ code: 'title-required', messageKiny: 'Umutwe urakenewe.', messageEn: 'Title is required.' });
    if (!patch.excerpt) errors.push({ code: 'excerpt-required', messageKiny: 'Incamake irakenewe.', messageEn: 'Excerpt is required.' });
    if (!patch.category) errors.push({ code: 'category-required', messageKiny: 'Icyiciro kirakenewe.', messageEn: 'Category is required.' });
    patch.status = patch.status ?? 'developing';
    patch.publishState = patch.publishState ?? 'published';
    patch.visibility = patch.visibility ?? 'public';
    patch.allowComments = patch.allowComments ?? true;
  }

  const seen = new Set<string>();
  const unique = errors.filter((e) => (seen.has(e.code) ? false : (seen.add(e.code), true)));
  return { errors: unique, patch };
}

/** Merge a patch into an existing document (undefined values delete keys). */
export function applyPatch(existing: Article, patch: Partial<Article>): Article {
  const next: Article = { ...existing };
  const bag = next as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch) as Array<[keyof Article, unknown]>) {
    if (value === undefined) delete bag[key as string];
    else bag[key as string] = value;
  }
  return next;
}
