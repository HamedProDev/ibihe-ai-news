/**
 * AI enrichment worker — proposes Kinyarwanda translations/key points for
 * English-source articles and enqueues them for HUMAN review.
 *
 * Nothing is auto-published: proposals land in the review queue
 * (/admin/review) and only reach articles after approve/edit.
 *
 * Requires ANTHROPIC_API_KEY; exits quietly otherwise.
 *
 * Usage:
 *   node workers/enrichment/run.ts [maxItems]
 */
import { listArticlesRepo, getArticleRepo } from '../../src/lib/db/repos/articles.ts';
import { createReviewItemsRepo, hasPendingRepo } from '../../src/lib/db/repos/reviews.ts';
import { AI_MODEL, isAIConfigured, PROMPT_VERSIONS, translateToKinyarwanda } from '../../src/lib/ai/client.ts';
import { encodeValue, reviewItemId } from '../../src/lib/review/apply.ts';
import type { ReviewItem } from '../../src/lib/review/types.ts';

async function main(): Promise<void> {
  const maxItems = Math.min(25, Math.max(1, Number(process.argv[2] ?? 10) || 10));
  if (!isAIConfigured()) {
    console.log('[worker:enrichment] skipped — ANTHROPIC_API_KEY not configured.');
    return;
  }
  const { items } = await listArticlesRepo({ limit: 200 });
  // English-source articles whose Kinyarwanda fields are still fallbacks.
  const candidates = items.filter(
    (a) => !a.isMock && a.sources[0]?.language === 'en' && (a.keyPointsKiny.length === 0 || a.titleKiny === a.title),
  );
  console.log(`[worker:enrichment] candidates=${candidates.length} (cap ${maxItems})`);

  let proposed = 0;
  for (const c of candidates.slice(0, maxItems)) {
    const full = await getArticleRepo(c.id);
    if (!full) continue;
    const now = new Date().toISOString();
    const ai = {
      inputIds: [full.id],
      model: AI_MODEL,
      promptVersion: PROMPT_VERSIONS.translateRw,
      generatedAt: now,
      reviewStatus: 'unreviewed' as const,
    };
    const ctx = {
      titleKiny: full.titleKiny,
      titleEn: full.title,
      sourceName: full.sources[0]?.name,
      sourceUrl: full.sources[0]?.url,
    };
    const queue: ReviewItem[] = [];

    if (full.titleKiny === full.title && !(await hasPendingRepo(full.id, 'titleKiny'))) {
      const t = await translateToKinyarwanda(full.title);
      if (t) {
        queue.push({
          id: reviewItemId(full.id, 'titleKiny', t), kind: 'article-ai-field', refId: full.id,
          field: 'titleKiny', status: 'pending', proposedRw: t, proposedEn: full.title,
          currentRw: full.titleKiny, currentEn: '', context: ctx, ai,
          decidedBy: '', decidedAt: null, decisionNote: '', createdAt: now,
        });
      }
    }
    if (full.keyPointsKiny.length === 0 && full.keyPointsEn.length > 0 && !(await hasPendingRepo(full.id, 'keyPointsKiny'))) {
      const translated: string[] = [];
      for (const kp of full.keyPointsEn.slice(0, 4)) {
        const t = await translateToKinyarwanda(kp);
        if (t) translated.push(t);
      }
      if (translated.length > 0) {
        queue.push({
          id: reviewItemId(full.id, 'keyPointsKiny', translated.join('|')), kind: 'article-ai-field', refId: full.id,
          field: 'keyPointsKiny', status: 'pending',
          proposedRw: encodeValue('keyPointsKiny', translated), proposedEn: JSON.stringify(full.keyPointsEn),
          currentRw: '[]', currentEn: JSON.stringify(full.keyPointsEn), context: ctx, ai,
          decidedBy: '', decidedAt: null, decisionNote: '', createdAt: now,
        });
      }
    }
    if (queue.length > 0) {
      await createReviewItemsRepo(queue);
      proposed += queue.length;
      console.log(`[worker:enrichment] ${full.id}: queued ${queue.length} proposal(s)`);
    }
  }
  console.log(`[worker:enrichment] done — proposed=${proposed}`);
}

main().catch((err: unknown) => {
  console.error('[worker:enrichment] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
