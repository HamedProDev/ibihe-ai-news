/**
 * Hardened RSS/Atom fetcher (server-only).
 *
 * - Per-request timeout + User-Agent (many feeds block default clients)
 * - Never throws: per-feed errors are returned as data
 * - No `any`: unknown feed shapes are validated before use
 * - Strips HTML from snippets
 */
import Parser from 'rss-parser';
import type { RawFeedItem } from '../../types/news';
import { enabledFeedSources, type SourceDef } from '../news/source-registry.ts';

const parser = new Parser({
  timeout: 9000,
  headers: { 'User-Agent': 'IbiheNewsBot/1.0 (+https://ibihe.rw; contact@ibihe.rw)' },
  customFields: { item: ['media:content', 'media:thumbnail'] },
});

interface MediaField {
  $?: { url?: string };
  url?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function mediaUrl(item: unknown): string | undefined {
  if (!isRecord(item)) return undefined;
  const mc = item['media:content'];
  if (isRecord(mc)) {
    const dollar = mc.$;
    if (isRecord(dollar) && typeof dollar.url === 'string') return dollar.url;
    if (typeof mc.url === 'string') return mc.url;
  }
  const mt = item['media:thumbnail'];
  if (isRecord(mt)) {
    const dollar = mt.$;
    if (isRecord(dollar) && typeof dollar.url === 'string') return dollar.url;
  }
  const enc = item.enclosure as unknown as MediaField | undefined;
  if (enc && typeof enc.url === 'string') return enc.url;
  return undefined;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface FeedResult {
  source: SourceDef;
  items: RawFeedItem[];
  error?: string;
}

export async function fetchRSSFeed(source: SourceDef): Promise<FeedResult> {
  if (!source.feedUrl) return { source, items: [], error: 'no-feed-configured' };
  try {
    const feed = await parser.parseURL(source.feedUrl);
    const items: RawFeedItem[] = [];
    for (const raw of feed.items ?? []) {
      const title = str(raw.title);
      const link = str(raw.link);
      if (!title || !link || !isValidHttpUrl(link)) continue;
      const snippet =
        str(raw.contentSnippet) ??
        (typeof raw.content === 'string' ? stripHtml(raw.content).slice(0, 400) : '') ??
        '';
      items.push({
        title: title.slice(0, 300),
        excerpt: stripHtml(snippet).slice(0, 600),
        sourceName: source.name,
        sourceUrl: link,
        publishedAt: str(raw.pubDate) ?? str(raw.isoDate),
        imageUrl: mediaUrl(raw as unknown),
        language: source.language,
      });
      if (items.length >= 30) break;
    }
    return { source, items };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown-error';
    console.error(`[ingest] RSS failed for ${source.name}: ${msg}`);
    return { source, items: [], error: msg.slice(0, 200) };
  }
}

export async function fetchAllFeeds(): Promise<FeedResult[]> {
  const sources = enabledFeedSources();
  const settled = await Promise.allSettled(sources.map((s) => fetchRSSFeed(s)));
  return settled.map((r, i) => {
    const source = sources[i] as SourceDef;
    if (r.status === 'fulfilled') return r.value;
    return { source, items: [], error: r.reason instanceof Error ? r.reason.message : 'failed' };
  });
}

/** @deprecated Use SOURCE_REGISTRY — kept for backwards compatibility. */
export const RSS_SOURCES = enabledFeedSources().map((s) => ({
  name: s.name,
  url: s.feedUrl ?? s.homeUrl,
  lang: s.language,
  category: s.defaultCategory,
}));
