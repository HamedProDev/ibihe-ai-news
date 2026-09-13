/**
 * Video embedding rules for the newsroom.
 *
 * Editors paste a URL; we parse it into { provider, videoId, embedUrl }.
 * The embed URL is ALWAYS rebuilt here (never taken from the client), and it
 * must land on one of the whitelisted hosts below — that is what makes it safe
 * to drop into an <iframe>. Direct files must be https and end in a known
 * media extension.
 *
 * Pure module: usable from the API, the admin form and the article page.
 */
import type { VideoAsset, VideoProvider } from '@/types/news';

/** Hosts we are willing to put inside an iframe. */
const EMBED_HOSTS: Record<string, VideoProvider> = {
  'www.youtube.com': 'youtube',
  'youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'www.youtube-nocookie.com': 'youtube',
  'player.vimeo.com': 'vimeo',
  'vimeo.com': 'vimeo',
  'www.dailymotion.com': 'dailymotion',
  'dailymotion.com': 'dailymotion',
  'geo.dailymotion.com': 'dailymotion',
  'www.facebook.com': 'facebook',
  'facebook.com': 'facebook',
  'm.facebook.com': 'facebook',
  'player.facebook.com': 'facebook',
  'twitter.com': 'x',
  'www.twitter.com': 'x',
  'x.com': 'x',
};

/** Extensions accepted for self-hosted / direct-file video. */
const FILE_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i;
const HLS_EXT = /\.m3u8(\?|#|$)/i;

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  dailymotion: 'Dailymotion',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  file: 'Fichier / Direct',
  hls: 'HLS stream',
};

export interface ParsedVideo {
  provider: VideoProvider;
  videoId?: string;
  /** Cleaned canonical URL (what we store). */
  url: string;
  /** iframe/video src we render — https, whitelisted. */
  embedUrl: string;
  thumbnailUrl?: string;
  /** False for providers we only link out to (X, Facebook without player). */
  embeddable: boolean;
  startSec?: number;
  playlistId?: string;
}

function secondsParam(p: URLSearchParams): number | undefined {
  for (const key of ['t', 'start', 'abroDuration']) {
    const v = p.get(key);
    if (!v) continue;
    const n = /^\d+$/.test(v) ? Number(v) : /^(\d+)m(\d+)s$/.exec(v);
    if (typeof n === 'number') return n;
    if (Array.isArray(n)) return Number(n[1]) * 60 + Number(n[2]);
  }
  return undefined;
}

function youtubeId(path: string): string | undefined {
  const m = /(?:^\/embed\/|^\/v\/|^\/shorts\/|^\/live\/)([A-Za-z0-9_-]{6,20})/.exec(path);
  if (m) return m[1];
  return undefined;
}

/** Parse any pasted video URL. Returns null when it is not a video we accept. */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const input = raw.trim();
  if (!input) return null;
  let u: URL;
  try {
    u = new URL(input.startsWith('http://') ? `https://${input.slice(7)}` : input);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase();
  const path = u.pathname;
  const provider = EMBED_HOSTS[host];

  if (provider === 'youtube') {
    const id = host === 'youtu.be' ? path.slice(1).split('/')[0] : new URLSearchParams(u.search).get('v') || youtubeId(path);
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    const start = secondsParam(u.searchParams);
    const params = new URLSearchParams({ rel: '0' });
    if (start) params.set('start', String(start));
    if (u.searchParams.get('list')) params.set('list', u.searchParams.get('list') as string);
    return {
      provider: 'youtube',
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      embeddable: true,
      startSec: start,
      playlistId: u.searchParams.get('list') ?? undefined,
    };
  }

  if (provider === 'vimeo') {
    const m = /(?:^\/video\/|^\/)(\d{6,12})/.exec(path);
    if (!m) return null;
    return {
      provider: 'vimeo',
      videoId: m[1],
      url: `https://vimeo.com/${m[1]}`,
      embedUrl: `https://player.vimeo.com/video/${m[1]}`,
      embeddable: true,
    };
  }

  if (provider === 'dailymotion') {
    const m = /(?:^\/video\/|^\/cdn\/embed\/video\/)([A-Za-z0-9]{6,20})/.exec(path);
    if (!m) return null;
    return {
      provider: 'dailymotion',
      videoId: m[1],
      url: `https://www.dailymotion.com/video/${m[1]}`,
      embedUrl: `https://geo.dailymotion.com/player.html?video=${m[1]}`,
      embeddable: true,
    };
  }

  if (provider === 'facebook') {
    const m = /\/videos\/(\d+)|[?&]v=(\d+)/.exec(`${path}${u.search}`);
    if (m) {
      const id = m[1] ?? m[2];
      return {
        provider: 'facebook',
        videoId: id,
        url: input,
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(input)}&show_text=false`,
        embeddable: true,
      };
    }
    return { provider: 'facebook', url: input, embedUrl: input, embeddable: false };
  }

  if (provider === 'x') {
    const m = /\/status(?:es)?\/(\d+)/.exec(path);
    if (!m) return null;
    return {
      provider: 'x',
      videoId: m[1],
      url: input,
      embedUrl: `https://twitter.com/i/broadcasts/1eAxmPl8vkZ15`,
      embeddable: false,
    };
  }

  // Self-hosted file or stream on any https host (newsroom CDN, Supabase…).
  if (HLS_EXT.test(path)) {
    return { provider: 'hls', url: input, embedUrl: input, embeddable: false };
  }
  if (FILE_EXT.test(path)) {
    return { provider: 'file', url: input, embedUrl: input, embeddable: false };
  }
  return null;
}

/**
 * Validate + normalize videos coming from the admin API.
 * Anything unparsable is dropped; embedUrl is always recomputed here.
 */
export function normalizeVideos(input: unknown): VideoAsset[] {
  if (!Array.isArray(input)) return [];
  const out: VideoAsset[] = [];
  for (const raw of input.slice(0, 12)) {
    if (!raw || typeof raw !== 'object') continue;
    const v = raw as Record<string, unknown>;
    const parsed = parseVideoUrl(String(v.url ?? v.embedUrl ?? ''));
    if (!parsed) continue;
    const str = (key: string, max = 300): string | undefined => {
      const val = typeof v[key] === 'string' ? (v[key] as string).trim() : '';
      return val ? val.slice(0, max) : undefined;
    };
    const num = (key: string): number | undefined => {
      const n = Number(v[key]);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    };
    const placement = v.placement === 'hero' || v.placement === 'aside' ? v.placement : 'inline';
    out.push({
      id: str('id', 40) ?? `vid-${Date.now().toString(36)}-${out.length}`,
      provider: parsed.provider,
      ...(parsed.videoId ? { videoId: parsed.videoId } : {}),
      url: parsed.url,
      embedUrl: parsed.embedUrl,
      placement,
      ...(str('title') ? { title: str('title') } : {}),
      ...(str('titleKiny') ? { titleKiny: str('titleKiny') } : {}),
      ...(str('caption', 600) ? { caption: str('caption', 600) } : {}),
      ...(str('captionKiny', 600) ? { captionKiny: str('captionKiny', 600) } : {}),
      ...(str('attribution', 160) ? { attribution: str('attribution', 160) } : {}),
      ...(str('transcript', 6000) ? { transcript: str('transcript', 6000) } : {}),
      ...((str('language') ?? '') ? { language: str('language', 8) } : {}),
      // Thumbnails we can derive (YouTube) are filled in automatically.
      ...((str('thumbnailUrl', 800) || parsed.thumbnailUrl) && { thumbnailUrl: str('thumbnailUrl', 800) || parsed.thumbnailUrl }),
      ...(num('durationSec') !== undefined ? { durationSec: num('durationSec') } : {}),
      ...(num('startSec') !== undefined ? { startSec: num('startSec') } : parsed.startSec !== undefined ? { startSec: parsed.startSec } : {}),
      ...(str('internalNote', 600) ? { internalNote: str('internalNote', 600) } : {}),
    });
  }
  return out;
}

/** Only these hosts may ever be framed (used again at render time). */
export function isSafeEmbedUrl(embedUrl: string): boolean {
  try {
    const u = new URL(embedUrl);
    if (u.protocol !== 'https:') return false;
    return Boolean(EMBED_HOSTS[u.hostname.toLowerCase()]);
  } catch {
    return false;
  }
}

/** Direct <video src> must be an allowed https media file. */
export function isSafeFileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (FILE_EXT.test(u.pathname) || HLS_EXT.test(u.pathname));
  } catch {
    return false;
  }
}

export function isIframeEmbeddable(v: Pick<VideoAsset, 'provider' | 'embedUrl'>): boolean {
  return v.provider !== 'file' && v.provider !== 'hls' && v.provider !== 'x' && isSafeEmbedUrl(v.embedUrl);
}

export function durationLabel(sec?: number): string {
  if (!sec || sec <= 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
