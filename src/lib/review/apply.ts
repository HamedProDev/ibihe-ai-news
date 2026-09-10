/**
 * Review decision application (pure, tested).
 *
 * - approve: copy the proposed value onto the article field.
 * - edit:    copy the human-edited value instead.
 * - flag:    leave the article untouched (content stays unpublished-labeled).
 *
 * Applying a decision also marks the article's AI provenance as reviewed.
 */
import type { Article } from '../../types/news';
import type { ReviewDecision, ReviewItem } from './types.ts';

export function decodeValue(field: ReviewItem['field'], raw: string): string | string[] {
  if (field === 'keyPointsKiny') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      /* fall through to line-split */
    }
    return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return raw;
}

export function encodeValue(field: ReviewItem['field'], value: string | string[]): string {
  if (field === 'keyPointsKiny') {
    return JSON.stringify(Array.isArray(value) ? value : [value]);
  }
  return Array.isArray(value) ? value.join('\n') : value;
}

export interface ApplyInput {
  decision: ReviewDecision;
  /** Required when decision === 'edit' (raw textarea: one point per line for key points). */
  editedRaw?: string;
}

export function applyReviewToArticle(article: Article, item: ReviewItem, input: ApplyInput): Article {
  if (input.decision === 'flag') return article;
  const raw = input.decision === 'edit' ? (input.editedRaw ?? item.proposedRw) : item.proposedRw;
  const value = decodeValue(item.field, raw);
  const next: Article = { ...article };

  if (item.field === 'keyPointsKiny') {
    next.keyPointsKiny = Array.isArray(value) ? value.slice(0, 6) : [value].slice(0, 6);
  } else if (item.field === 'titleKiny') {
    next.titleKiny = typeof value === 'string' ? value.slice(0, 300) : value.join(' ').slice(0, 300);
  } else if (item.field === 'excerptKiny') {
    next.excerptKiny = typeof value === 'string' ? value.slice(0, 600) : value.join(' ').slice(0, 600);
  }

  if (next.generated) {
    next.generated = { ...next.generated, reviewStatus: 'reviewed' };
  }
  return next;
}

/** Build a review item id (stable per article+field+proposal hash). */
export function reviewItemId(refId: string, field: string, proposedRw: string): string {
  let h = 0;
  const s = `${refId}|${field}|${proposedRw}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `rev-${refId.slice(0, 12)}-${field}-${Math.abs(h).toString(36)}`;
}
