import type { AIGeneration } from '../../types/provenance';

/** Which AI-produced field is under review. */
export type ReviewField = 'titleKiny' | 'excerptKiny' | 'keyPointsKiny';

/** Review item lifecycle. */
export type ReviewStatus = 'pending' | 'approved' | 'edited' | 'flagged';

export type ReviewDecision = 'approve' | 'edit' | 'flag';

/**
 * One proposed AI output awaiting (or having received) human review.
 * For keyPointsKiny, proposed/current values are JSON-encoded string arrays;
 * for title/excerpt they are plain strings.
 */
export interface ReviewItem {
  id: string;
  kind: 'article-ai-field';
  refId: string;
  field: ReviewField;
  status: ReviewStatus;
  proposedRw: string;
  proposedEn: string;
  currentRw: string;
  currentEn: string;
  context: {
    titleKiny?: string;
    titleEn?: string;
    sourceName?: string;
    sourceUrl?: string;
  };
  ai: AIGeneration;
  decidedBy: string;
  decidedAt: string | null;
  decisionNote: string;
  createdAt: string;
}
