/**
 * Kinyarwanda-first full-text search over the article database.
 * Prefix-tolerant token matching with field weighting. Pure/deterministic.
 */
import type { Article } from '../../types/news';

const RW_STOPWORDS = new Set([
  'mu', 'ku', 'na', 'ya', 'rya', 'by', 'wa', 'za', 'ka', 'sha', 'muri', 'kuri', 'buri', 'iyo',
  'uyu', 'runo', 'iyi', 'ibi', 'aba', 'abo', 'uyu', 'ni', 'nta', 'ko', 'ngo', 'kandi',
  'ariko', 'cyangwa', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'and', 'or', 'is', 'are',
]);

export function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !RW_STOPWORDS.has(t));
}

function fieldTokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Prefix-tolerant match: query token matches field token if equal or a prefix (min 4 chars). */
function tokenScore(queryTok: string, fieldToks: string[]): number {
  let best = 0;
  for (const f of fieldToks) {
    if (f === queryTok) return 1;
    if (queryTok.length >= 4 && f.startsWith(queryTok)) best = Math.max(best, 0.8);
    else if (f.length >= 4 && queryTok.startsWith(f)) best = Math.max(best, 0.7);
  }
  return best;
}

export interface SearchHit {
  article: Article;
  score: number;
  matchedTerms: string[];
}

export function searchArticles(articles: Article[], query: string, limit = 20): SearchHit[] {
  const qToks = tokenizeQuery(query);
  if (qToks.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const a of articles) {
    const titleF = fieldTokens(`${a.titleKiny} ${a.title}`);
    const excerptF = fieldTokens(`${a.excerptKiny} ${a.excerpt}`);
    const tagF = fieldTokens(a.tags.join(' '));
    const entF = fieldTokens(a.entities.map((e) => `${e.text} ${e.normalized}`).join(' '));
    let score = 0;
    const matched: string[] = [];
    for (const q of qToks) {
      const s =
        tokenScore(q, titleF) * 3 + tokenScore(q, entF) * 2 + tokenScore(q, tagF) * 2 + tokenScore(q, excerptF);
      if (s > 0) {
        score += s;
        matched.push(q);
      }
    }
    if (score > 0) hits.push({ article: a, score, matchedTerms: matched });
  }
  hits.sort((x, y) => y.score - x.score || +new Date(y.article.publishedAt) - +new Date(x.article.publishedAt));
  return hits.slice(0, limit);
}
