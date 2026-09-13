/**
 * Review-queue repository — Postgres when configured, else JSON.
 * Decisions are append-only history: rows are never deleted by the app.
 */
import type { ReviewItem, ReviewStatus } from '../../review/types.ts';
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

const STORE = 'review-items';

export async function createReviewItemsRepo(items: ReviewItem[]): Promise<void> {
  if (items.length === 0) return;
  if (isPostgresEnabled()) {
    try {
      for (const it of items) {
        await pgQuery(
          `INSERT INTO review_items (id, kind, ref_id, field, status, proposed_rw, proposed_en,
             current_rw, current_en, context, ai, decided_by, decided_at, decision_note, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           ON CONFLICT (id) DO NOTHING`,
          [it.id, it.kind, it.refId, it.field, it.status, it.proposedRw, it.proposedEn,
            it.currentRw, it.currentEn, JSON.stringify(it.context), JSON.stringify(it.ai),
            it.decidedBy, it.decidedAt, it.decisionNote, it.createdAt],
        );
      }
      return;
    } catch (err) {
      console.error('[db] reviews pg create failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const existing = (await readStore<ReviewItem[]>(STORE))?.value ?? [];
  const ids = new Set(existing.map((r) => r.id));
  await writeStore(STORE, [...existing, ...items.filter((i) => !ids.has(i.id))].slice(-2000));
}

export async function listReviewsRepo(status?: ReviewStatus | 'all'): Promise<ReviewItem[]> {
  if (isPostgresEnabled()) {
    try {
      const r = status && status !== 'all'
        ? await pgQuery<ReviewItem & Record<string, never>>(
            `SELECT id, kind, ref_id AS "refId", field, status,
                    proposed_rw AS "proposedRw", proposed_en AS "proposedEn",
                    current_rw AS "currentRw", current_en AS "currentEn",
                    context, ai, decided_by AS "decidedBy",
                    decided_at AS "decidedAt", decision_note AS "decisionNote",
                    created_at AS "createdAt"
             FROM review_items WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
            [status],
          )
        : await pgQuery<ReviewItem & Record<string, never>>(
            `SELECT id, kind, ref_id AS "refId", field, status,
                    proposed_rw AS "proposedRw", proposed_en AS "proposedEn",
                    current_rw AS "currentRw", current_en AS "currentEn",
                    context, ai, decided_by AS "decidedBy",
                    decided_at AS "decidedAt", decision_note AS "decisionNote",
                    created_at AS "createdAt"
             FROM review_items ORDER BY created_at DESC LIMIT 200`,
          );
      return r.rows.map((row) => ({
        ...row,
        decidedAt: row.decidedAt ? new Date(row.decidedAt as unknown as string).toISOString() : null,
        createdAt: new Date(row.createdAt as unknown as string).toISOString(),
      }));
    } catch (err) {
      console.error('[db] reviews pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<ReviewItem[]>(STORE))?.value ?? [];
  const filtered = !status || status === 'all' ? all : all.filter((r) => r.status === status);
  return filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 200);
}

export async function getReviewRepo(id: string): Promise<ReviewItem | null> {
  const all = await listReviewsRepo('all');
  return all.find((r) => r.id === id) ?? null;
}

export async function decideReviewRepo(
  id: string,
  patch: { status: ReviewStatus; decidedBy: string; decidedAt: string; decisionNote: string; proposedRw?: string },
): Promise<ReviewItem | null> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `UPDATE review_items SET status = $2, decided_by = $3, decided_at = $4,
          decision_note = $5, proposed_rw = COALESCE($6, proposed_rw) WHERE id = $1`,
        [id, patch.status, patch.decidedBy, patch.decidedAt, patch.decisionNote, patch.proposedRw ?? null],
      );
      return getReviewRepo(id);
    } catch (err) {
      console.error('[db] reviews pg decide failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<ReviewItem[]>(STORE))?.value ?? [];
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1 || !all[idx]) return null;
  const updated: ReviewItem = {
    ...all[idx],
    status: patch.status,
    decidedBy: patch.decidedBy,
    decidedAt: patch.decidedAt,
    decisionNote: patch.decisionNote,
    proposedRw: patch.proposedRw ?? all[idx].proposedRw,
  };
  all[idx] = updated;
  await writeStore(STORE, all);
  return updated;
}

/** True when a pending item already exists for this article+field. */
export async function hasPendingRepo(refId: string, field: string): Promise<boolean> {
  const pending = await listReviewsRepo('pending');
  return pending.some((r) => r.refId === refId && r.field === field);
}
