/**
 * Deduplication: the same real-world event published by several outlets must
 * become ONE story cluster, not N "different" news items.
 *
 * Strategy (deterministic, no ML required):
 *  1. Normalize titles (lowercase, strip punctuation/sites suffixes).
 *  2. Exact hash match on normalized title + date bucket.
 *  3. Fuzzy Jaccard similarity on title token sets (>= threshold) within a
 *     time window.
 */
import { createHash } from 'node:crypto';

const SITE_SUFFIXES =
  /(\s*[|\-–—:]\s*(the new times|igihe|kt press|rba|bbc|reuters|allafrica|new times)).*$/i;

const STOPWORDS = new Set([
  'mu', 'ku', 'mu', 'na', 'ya', 'ya', 'rya', 'ry', 'by', 'wa', 'za', 'ka', 'sha', 'the', 'a', 'an',
  'of', 'in', 'on', 'to', 'for', 'and', 'or', 'ni', 'nta', 'ko', 'ngo', 'iyo', 'uyu', 'runo',
]);

export function normalizeTitle(title: string): string {
  return title
    .replace(SITE_SUFFIXES, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleTokens(title: string): string[] {
  return normalizeTitle(title)
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Stable content hash for exact-match dedup. */
export function contentHash(title: string, dateBucket: string): string {
  return createHash('sha256').update(`${normalizeTitle(title)}|${dateBucket}`).digest('hex').slice(0, 16);
}

/** Day bucket (YYYY-MM-DD) for grouping near-simultaneous publications. */
export function dayBucket(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return d.toISOString().slice(0, 10);
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DedupCandidate {
  id: string;
  title: string;
  publishedAt: string;
}

export interface DuplicateGroup {
  /** Canonical (earliest) item id. */
  canonicalId: string;
  /** Ids considered duplicates of the canonical item. */
  duplicateIds: string[];
  /** Highest similarity observed in the group. */
  maxSimilarity: number;
}

/**
 * Group near-duplicate items. Items are only compared within `windowHours`
 * of each other. Deterministic: earliest item wins as canonical.
 */
export function findDuplicates(
  items: DedupCandidate[],
  options: { threshold?: number; windowHours?: number } = {},
): DuplicateGroup[] {
  const threshold = options.threshold ?? 0.45;
  const windowMs = (options.windowHours ?? 72) * 3600 * 1000;
  const sorted = [...items].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );

  const assigned = new Set<string>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const base = sorted[i];
    if (!base || assigned.has(base.id)) continue;
    const baseTime = new Date(base.publishedAt).getTime();
    const baseTokens = titleTokens(base.title);
    const baseHash = contentHash(base.title, dayBucket(base.publishedAt));
    const dupIds: string[] = [];
    let maxSim = 0;

    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j];
      if (!other || assigned.has(other.id)) continue;
      const otherTime = new Date(other.publishedAt).getTime();
      if (Number.isNaN(otherTime) || Math.abs(otherTime - baseTime) > windowMs) continue;
      const otherHash = contentHash(other.title, dayBucket(other.publishedAt));
      if (baseHash === otherHash) {
        dupIds.push(other.id);
        assigned.add(other.id);
        maxSim = 1;
        continue;
      }
      const sim = jaccard(baseTokens, titleTokens(other.title));
      if (sim >= threshold) {
        dupIds.push(other.id);
        assigned.add(other.id);
        if (sim > maxSim) maxSim = sim;
      }
    }

    if (dupIds.length > 0) {
      assigned.add(base.id);
      groups.push({ canonicalId: base.id, duplicateIds: dupIds, maxSimilarity: maxSim });
    }
  }
  return groups;
}
