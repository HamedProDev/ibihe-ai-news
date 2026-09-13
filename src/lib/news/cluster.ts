/**
 * Story clustering: group articles about the same event into a StoryCluster.
 *
 * Deterministic single-pass clustering:
 *  - candidate pair if same category AND (title Jaccard >= 0.3 OR >= 2 shared
 *    key entities) AND published within the time window.
 * Union-find merges transitive groups. No ML, fully explainable.
 */
import type { Article, Entity, StoryCluster } from '../../types/news';
import { entityKey } from './entities.ts';
import { jaccard, titleTokens } from './deduplicate.ts';

export interface ClusterOptions {
  titleThreshold?: number;
  minSharedEntities?: number;
  windowHours?: number;
}

function sharedKeyEntities(a: Entity[], b: Entity[]): number {
  const keep = new Set(['person', 'organization', 'district', 'location', 'commodity', 'market', 'event']);
  const aKeys = new Set(a.filter((e) => keep.has(e.type)).map(entityKey));
  let n = 0;
  for (const e of b) {
    if (keep.has(e.type) && aKeys.has(entityKey(e))) n++;
  }
  return n;
}

export function clusterArticles(articles: Article[], options: ClusterOptions = {}): StoryCluster[] {
  const titleThreshold = options.titleThreshold ?? 0.3;
  const minShared = options.minSharedEntities ?? 2;
  const windowMs = (options.windowHours ?? 96) * 3600 * 1000;

  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = parent.get(x) ?? x;
    while ((parent.get(r) ?? r) !== r) r = parent.get(r) ?? r;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string): void => {
    parent.set(find(a), find(b));
  };

  const sorted = [...articles].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );
  const tokens = new Map(sorted.map((a) => [a.id, titleTokens(a.titleKiny + ' ' + a.title)] as [string, string[]]));

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (!a) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (!b || a.category !== b.category) continue;
      const dt = Math.abs(new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
      if (Number.isNaN(dt) || dt > windowMs) continue;
      const sim = jaccard(tokens.get(a.id) ?? [], tokens.get(b.id) ?? []);
      const shared = sharedKeyEntities(a.entities, b.entities);
      if (sim >= titleThreshold || shared >= minShared) union(a.id, b.id);
    }
  }

  const groups = new Map<string, Article[]>();
  for (const a of sorted) {
    const root = find(a.id);
    const g = groups.get(root) ?? [];
    g.push(a);
    groups.set(root, g);
  }

  const clusters: StoryCluster[] = [];
  let n = 0;
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    n++;
    const first = members[0];
    if (!first) continue;
    // Key entities = entities appearing in 2+ member articles.
    const counts = new Map<string, { e: Entity; n: number }>();
    for (const m of members) {
      const seen = new Set<string>();
      for (const e of m.entities) {
        const k = entityKey(e);
        if (seen.has(k)) continue;
        seen.add(k);
        const cur = counts.get(k) ?? { e, n: 0 };
        cur.n++;
        counts.set(k, cur);
      }
    }
    const keyEntities = [...counts.values()].filter((c) => c.n >= 2).map((c) => c.e);
    const times = members.map((m) => m.publishedAt).sort();
    clusters.push({
      id: `cluster-${n}`,
      title: first.title,
      titleKiny: first.titleKiny,
      category: first.category,
      status: members.length >= 3 ? 'multi-source' : 'developing',
      articleIds: members.map((m) => m.id),
      keyEntities,
      firstSeenAt: times[0] ?? first.publishedAt,
      lastSeenAt: times[times.length - 1] ?? first.publishedAt,
      timeline: members.map((m) => ({
        at: m.publishedAt,
        headlineKiny: m.titleKiny,
        headlineEn: m.title,
        articleId: m.id,
      })),
      isMock: members.every((m) => m.isMock),
    });
  }
  return clusters;
}

/** Find articles related to `article` (shared entities/category), excluding itself. */
export function relatedArticles(article: Article, pool: Article[], limit = 4): Article[] {
  const keys = new Set(article.entities.map(entityKey));
  const scored = pool
    .filter((a) => a.id !== article.id)
    .map((a) => {
      let shared = 0;
      for (const e of a.entities) if (keys.has(entityKey(e))) shared++;
      const sameCat = a.category === article.category ? 1 : 0;
      return { a, score: shared * 2 + sameCat };
    })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || +new Date(y.a.publishedAt) - +new Date(x.a.publishedAt));
  return scored.slice(0, limit).map((s) => s.a);
}
