/**
 * Ingestion pipeline (server-only):
 *
 *   FEEDS → FETCH → VALIDATE → NORMALIZE → ENTITIES → DEDUP → STORE
 *
 * Every stored article keeps: source URL, source name, publication time and
 * fetch time. Nothing is overwritten silently — re-ingestion upserts by
 * stable id and preserves first-seen timestamps.
 */
import type { Article, NewsCategory, RawFeedItem } from '../../types/news';
import { fetchAllFeeds } from '../scraper/rss-fetcher.ts';
import { contentHash, dayBucket, findDuplicates } from './deduplicate.ts';
import { extractEntities } from './entities.ts';
import { extractKeyPoints, extractiveProvenance } from './summarize.ts';
import { findSource } from './source-registry.ts';
import { listArticlesRepo, upsertArticlesRepo } from '../db/repos/articles.ts';
import { getMeta, recordIngestRun, setMeta } from '../db/repos/meta.ts';

export const ARTICLES_STORE = 'articles';
export const INGEST_META_STORE = 'ingest-meta';

export interface IngestMeta {
  lastRunAt: string;
  lastSuccessAt: string | null;
  totalStored: number;
  addedLastRun: number;
  errors: string[];
}

/** Keyword-based category classification. Conservative: defaults to 'amahanga'. */
export function classifyCategory(title: string, excerpt: string): NewsCategory {
  const t = `${title} ${excerpt}`.toLowerCase();
  const has = (...words: string[]): boolean => words.some((w) => t.includes(w));
  // Breaking is a flag (set in normalizeItem), not a section — it lands in
  // the Rwanda feed. Explicit markers only, never guess.
  if (has('breaking', 'just in', 'amakuru agezweho', 'birihutirwa', 'live:')) return 'rwanda';
  if (
    has(
      'ibirayi', 'ibishyimbo', 'ibigori', 'inyanya', 'igitoki', 'umuceri', 'imyumbati',
      'ikawa', 'icyayi', 'amata', 'inka', 'ubworozi', 'ifumbire', 'imbuto',
      'potato', 'bean', 'maize', 'cassava', 'rice', 'coffee', 'tea', 'milk', 'dairy',
      'cattle', 'livestock', 'fertilizer', 'seed', 'harvest', 'crop', 'farm',
      'umusaruro', 'ubuhinzi', 'umuhinzi', 'abahinzi', 'rab', 'minagri',
      'imvura', 'rainfall', 'rain', 'drought', 'amapfa', 'flood', 'umwuzure',
      'food security', 'ibiribwa', 'nutrition', 'imirire',
    )
  )
    return 'ubukungu';
  if (
    has(
      'uburezi', 'amashuri', 'ishuri', 'school', 'university', 'kaminuza', 'REB',
      'ibizamini', 'exam', 'scholarship', 'buruse', 'umwarimu', 'teacher', 'student', 'abanyeshuri',
    )
  )
    return 'uburezi';
  if (
    has(
      'imyidagaduro', 'entertainment', 'concert', 'film', 'cinema', 'umuziki',
      'music', 'celebrity', 'igitecyerezo', 'talent', 'show', 'series', 'album',
    )
  )
    return 'imyidagaduro';
  if (
    has(
      'umuco', 'culture', 'art', 'museum', 'ubugeni', ' Kwita Izina', 'festival',
      'heritage', 'umuganda', 'ingando', 'traditional', 'ibitaramo',
    )
  )
    return 'umuco';
  if (
    has(
      'bnr', 'ifaranga', 'rwf', 'frw', 'exchange', 'inflation', 'gdp', 'ubukungu',
      'bank', 'banki', 'igiciro', 'price', 'market', 'isoko', 'trade', 'ubucuruzi',
      'export', 'import', 'tax', 'umusoro', 'loan', 'inguzanyo', ' world bank',
      'imf', 'investment', 'ishoramari', 'business', 'ubucuruzi', 'economy',
      'salary', 'umushahara', 'poverty', 'ubukene', 'rra', 'rssb', 'insurance',
    )
  )
    return 'ubukungu';
  if (
    has(
      'mtn', 'airtel', '5g', '4g', 'internet', 'ikoranabuhanga', 'technology',
      'software', 'app', 'digital', 'ai', 'artificial intelligence', 'robot',
      'phone', 'telephone', 'telefoni', 'computer', 'mudasobwa', 'cyber',
      'startup', 'fintech', 'momo', 'mobile money',
    )
  )
    return 'ikoranabuhanga';
  if (
    has(
      'ubuzima', 'health', 'hospital', 'ibitaro', 'vaccine', 'urukingo',
      'malaria', 'malariya', 'cholera', 'kolera', 'ebola', 'covid', 'doctor',
      'muganga', 'nurse', 'umuforomo', 'disease', 'indwara', 'clinic',
      'ivuriro', 'rbc', 'minisante', 'mental health',
    )
  )
    return 'ubuzima';
  if (
    has(
      'sport', 'sports', 'imikino', 'umupira', 'football', 'basketball',
      'match', 'league', 'shampiyona', 'apr', 'rayon', 'stade', 'sitade',
      'olympic', 'marathon', 'cycling', 'caf', 'fifa', 'afcon',
    )
  )
    return 'imikino';
  if (
    has(
      'perezida', 'president', 'kagame', 'minisitiri', 'minister', 'politiki',
      'politics', 'election', 'amatora', 'parliament', 'inteko', 'senate',
      'senat', 'mayor', 'meya', 'governor', 'guverineri', 'policy', 'itegeko',
      'law', 'rights', 'uburenganzira', 'diplomat', 'embassy', 'government',
      'leta', 'cabinet', 'vote', 'itora',
    )
  )
    return 'politiki';
  return 'amahanga';
}

export function normalizeItem(item: RawFeedItem, fetchedAt: string): Article | null {
  if (!item.title || !item.sourceUrl) return null;
  let publishedAt = fetchedAt;
  if (item.publishedAt) {
    const d = new Date(item.publishedAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now() + 3600_000) {
      publishedAt = d.toISOString();
    }
  }
  const id = `a-${contentHash(item.sourceUrl + item.title, dayBucket(publishedAt))}`;
  const entities = extractEntities(item.title, item.excerpt);
  const category = classifyCategory(item.title, item.excerpt);
  const breaking = /\b(breaking|just in|birihutirwa)\b|amakuru agezweho|live:/i.test(
    `${item.title} ${item.excerpt}`,
  );
  const isKiny = item.language === 'rw';
  const keyPoints = extractKeyPoints(`${item.title}. ${item.excerpt}`.trim(), 4);
  const src = findSource(item.sourceName);
  return {
    id,
    title: isKiny ? item.title : item.title,
    titleKiny: item.title, // Falls back to original until a reviewed translation exists.
    excerpt: item.excerpt || item.title,
    excerptKiny: item.excerpt || item.title,
    category,
    status: src && src.trustTier === 1 ? 'verified' : 'developing',
    sources: [
      {
        name: item.sourceName,
        url: item.sourceUrl,
        publishedAt,
        fetchedAt,
        language: item.language,
      },
    ],
    imageUrl: item.imageUrl,
    publishedAt,
    fetchedAt,
    entities,
    keyPointsKiny: isKiny ? keyPoints : [],
    keyPointsEn: isKiny ? [] : keyPoints,
    generated: extractiveProvenance([id]),
    tags: entities
      .filter((e) => e.type === 'commodity' || e.type === 'district' || e.type === 'organization')
      .map((e) => e.normalized.toLowerCase())
      .slice(0, 6),
    views: 0,
    ...(breaking ? { breaking: true } : {}),
    isMock: false,
  };
}

export interface IngestResult {
  added: number;
  total: number;
  errors: string[];
  fetchedAt: string;
}

/** Run one ingestion pass over all enabled feeds. */
export async function runIngestion(): Promise<IngestResult> {
  const fetchedAt = new Date().toISOString();
  const [existing, results] = await Promise.all([listArticlesRepo({ limit: 500 }), fetchAllFeeds()]);
  const stored: Article[] = existing.items ?? [];
  const byId = new Map(stored.map((a) => [a.id, a]));
  const errors: string[] = [];
  let added = 0;

  // Normalize all fresh items first (so cross-source duplicates collapse).
  const fresh: Article[] = [];
  for (const r of results) {
    if (r.error) errors.push(`${r.source.name}: ${r.error}`);
    for (const item of r.items) {
      const a = normalizeItem(item, fetchedAt);
      if (a && !byId.has(a.id)) fresh.push(a);
    }
  }

  // Deduplicate fresh items against each other; keep canonical only.
  const dupGroups = findDuplicates(
    fresh.map((a) => ({ id: a.id, title: a.title, publishedAt: a.publishedAt })),
    { threshold: 0.5, windowHours: 72 },
  );
  const dupIds = new Set(dupGroups.flatMap((g) => g.duplicateIds));
  // Merge duplicate sources into the canonical article (multi-source evidence).
  const canonById = new Map(fresh.map((a) => [a.id, a]));
  for (const g of dupGroups) {
    const canon = canonById.get(g.canonicalId);
    if (!canon) continue;
    for (const dupId of g.duplicateIds) {
      const dup = canonById.get(dupId);
      if (!dup) continue;
      for (const s of dup.sources) {
        if (!canon.sources.some((x) => x.url === s.url)) canon.sources.push(s);
      }
    }
    if (canon.sources.length >= 2) canon.status = 'multi-source';
  }

  for (const a of fresh) {
    if (dupIds.has(a.id)) continue;
    byId.set(a.id, a);
    added++;
  }

  const all = [...byId.values()].sort((x, y) => +new Date(y.publishedAt) - +new Date(x.publishedAt));
  const capped = all.slice(0, 500); // retention cap; production should archive instead.
  await upsertArticlesRepo(capped);

  const prevMeta = await getMeta<IngestMeta>(INGEST_META_STORE);
  const meta: IngestMeta = {
    lastRunAt: fetchedAt,
    lastSuccessAt: errors.length < results.length ? fetchedAt : (prevMeta?.lastSuccessAt ?? null),
    totalStored: capped.length,
    addedLastRun: added,
    errors: errors.slice(0, 10),
  };
  await setMeta(INGEST_META_STORE, meta);
  await recordIngestRun({ startedAt: fetchedAt, finishedAt: new Date().toISOString(), added, total: capped.length, errors: errors.slice(0, 10) });
  return { added, total: capped.length, errors, fetchedAt };
}

export async function readStoredArticles(): Promise<Article[]> {
  return (await listArticlesRepo({ limit: 500 })).items;
}

export async function readIngestMeta(): Promise<IngestMeta | null> {
  return getMeta<IngestMeta>(INGEST_META_STORE);
}
