/**
 * Daily briefing builder: "By'ingenzi uyu munsi" in ≤60 seconds of reading.
 * Picks the freshest important stories (multi-source first, then verified,
 * then developing) and renders short bilingual bullets. Pure/deterministic.
 */
import type { Article } from '../../types/news';

export interface BriefingBullet {
  articleId: string;
  textKiny: string;
  textEn: string;
}

export interface DailyBriefing {
  date: string;
  bullets: BriefingBullet[];
  articleCount: number;
  generatedAt: string;
}

const STATUS_RANK: Record<Article['status'], number> = {
  'multi-source': 0,
  verified: 1,
  developing: 2,
  analysis: 3,
  forecast: 4,
  opinion: 5,
};

export function buildBriefing(articles: Article[], maxBullets = 5, today = new Date()): DailyBriefing {
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const fresh = articles.filter((a) => new Date(a.publishedAt).getTime() >= dayStart.getTime() - 48 * 3600_000);
  const pool = fresh.length > 0 ? fresh : articles;
  const ranked = [...pool].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );
  const bullets: BriefingBullet[] = ranked.slice(0, maxBullets).map((a) => ({
    articleId: a.id,
    textKiny: a.keyPointsKiny[0] ?? a.excerptKiny,
    textEn: a.keyPointsEn[0] ?? a.excerpt,
  }));
  return {
    date: today.toISOString().slice(0, 10),
    bullets,
    articleCount: pool.length,
    generatedAt: today.toISOString(),
  };
}
