/**
 * Markdown-lite story body.
 *
 * Editors write plain text with a handful of markers; we parse it into typed
 * blocks and render them with real React nodes — never `innerHTML`, so a
 * story body can never inject markup.
 *
 * Supported syntax
 *   ## Heading            → h2
 *   ### Sub-heading       → h3
 *   - item / * item       → bullet list
 *   1. item               → numbered list
 *   > quote               → blockquote (optional "— attribution" on last line)
 *   ![alt](https://…)     → figure
 *   {{video:VIDEO_ID}}    → the matching entry of article.videos, inline
 *   ---                   → separator
 *   **bold**  *italic*  `code`  [label](https://…)
 */
import type { VideoAsset } from '@/types/news';

export type Inline = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
};

export type Block =
  | { type: 'p'; inline: Inline[] }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: Inline[][] }
  | { type: 'ol'; items: Inline[][] }
  | { type: 'quote'; inline: Inline[]; cite?: string }
  | { type: 'image'; url: string; alt: string }
  | { type: 'video'; id: string }
  | { type: 'hr' };

const VIDEO_TOKEN = /^\{\{\s*video\s*:\s*([\w-]+)\s*\}\}$/i;

function safeUrl(raw: string): string | null {
  const value = raw.trim().replace(/[)\].,;:]+$/, '');
  if (!value) return null;
  if (value.startsWith('/')) return value;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Inline spans: links, **bold**, `code`, *italic*. Returns plain text nodes otherwise. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const push = (node: Inline): void => {
    if (!node.text) return;
    const last = out[out.length - 1];
    const plain = (n: Inline): boolean => !n.bold && !n.italic && !n.code && !n.link;
    if (last && plain(last) && plain(node)) {
      last.text += node.text;
      return;
    }
    out.push(node);
  };

  type Candidate = { at: number; end: number; node: Inline };
  const find = (rest: string): Candidate | null => {
    const hits: Candidate[] = [];
    const link = /\[([^\]]{1,200})\]\(([^)\s]{1,600})\)/.exec(rest);
    if (link) {
      const url = safeUrl(link[2]);
      hits.push({ at: link.index, end: link.index + link[0].length, node: url ? { text: link[1], link: url } : { text: link[0] } });
    }
    const bold = /\*\*([^*\n]{1,400})\*\*/.exec(rest);
    if (bold) hits.push({ at: bold.index, end: bold.index + bold[0].length, node: { text: bold[1], bold: true } });
    const code = /`([^`\n]{1,200})`/.exec(rest);
    if (code) hits.push({ at: code.index, end: code.index + code[0].length, node: { text: code[1], code: true } });
    const italic = /(^|[\s(\[])\*([^*\n]{1,400})\*(?=[\s.,;:!?)\]]|$)/.exec(rest);
    if (italic) {
      const at = italic.index + italic[1].length;
      hits.push({ at, end: at + italic[2].length + 2, node: { text: italic[2], italic: true } });
    }
    // Earliest span wins; ties keep the declaration order above (link > bold > code > italic).
    return hits.sort((a, b) => a.at - b.at)[0] ?? null;
  };

  let rest = src;
  let guard = 0;
  while (rest && guard++ < 400) {
    const hit = find(rest);
    if (!hit) {
      push({ text: rest });
      rest = '';
      break;
    }
    if (hit.at > 0) push({ text: rest.slice(0, hit.at) });
    push(hit.node);
    rest = rest.slice(Math.max(hit.end, hit.at + 1));
  }
  return out;
}

/** Split a body into typed blocks. Unknown lines become paragraphs. */
export function parseBody(body: string | undefined | null): Block[] {
  if (!body || !body.trim()) return [];
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, '\n').split('\n');

  let list: { ordered: boolean; items: Inline[][] } | null = null;
  const flushList = () => {
    if (list && list.items.length) blocks.push(list.ordered ? { type: 'ol', items: list.items } : { type: 'ul', items: list.items });
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }
    const video = VIDEO_TOKEN.exec(trimmed);
    if (video) {
      flushList();
      blocks.push({ type: 'video', id: video[1] });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)(.*)$/.exec(trimmed);
    if (img) {
      flushList();
      const url = safeUrl(img[2]);
      if (url) blocks.push({ type: 'image', url, alt: img[1] || '' });
      else blocks.push({ type: 'p', inline: parseInline(trimmed) });
      continue;
    }
    if (trimmed.startsWith('> ')) {
      flushList();
      const chunk = trimmed.slice(2).trim();
      const cite = /(^|\s)[—–-]\s+([\p{L}].{1,80})$/u.exec(chunk);
      const text = cite ? chunk.slice(0, cite.index).trim() : chunk;
      blocks.push({ type: 'quote', inline: parseInline(text), ...(cite ? { cite: cite[2].trim() } : {}) });
      continue;
    }
    const ul = /^[-*•]\s+(.+)$/.exec(trimmed);
    const ol = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (ul || ol) {
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(parseInline((ol?.[1] ?? ul?.[1] ?? '').trim()));
      continue;
    }
    flushList();
    // A line that is only a URL becomes a clickable paragraph.
    const lone = /^(https?:\/\/\S+)$/.exec(trimmed);
    if (lone) {
      const url = safeUrl(lone[1]);
      blocks.push({ type: 'p', inline: url ? [{ text: url, link: url }] : [{ text: trimmed }] });
      continue;
    }
    blocks.push({ type: 'p', inline: parseInline(trimmed) });
  }
  flushList();
  return blocks;
}

/** Plain-text rendering (meta descriptions, search snippets, reading time). */
export function bodyToPlainText(body: string | undefined | null): string {
  if (!body) return '';
  return body
    .replace(/\{\{\s*video\s*:\s*[\w-]+\s*\}\}/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minutes to read (≈200 wpm, 155 words/min for Kinyarwanda syllable load). */
export function estimateReadingMinutes(...texts: Array<string | undefined | null>): number {
  const words = texts
    .map((t) => bodyToPlainText(t))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) return 0;
  return Math.max(1, Math.round(words / 190));
}

/** Videos referenced by the body, in document order. */
export function referencedVideos(blocks: Block[], videos: VideoAsset[]): VideoAsset[] {
  const byId = new Map(videos.map((v) => [v.id, v]));
  return blocks
    .filter((b): b is { type: 'video'; id: string } => b.type === 'video')
    .map((b) => byId.get(b.id))
    .filter((v): v is VideoAsset => Boolean(v));
}

/** Inline {{video:id}} tokens that pointed at a removed clip. */
export function danglingVideoTokens(blocks: Block[], videos: VideoAsset[]): string[] {
  const ids = new Set(videos.map((v) => v.id));
  return blocks.filter((b): b is { type: 'video'; id: string } => b.type === 'video').filter((b) => !ids.has(b.id)).map((b) => b.id);
}
