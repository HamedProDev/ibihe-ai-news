/**
 * Analytics events. One row per interaction; the dashboard groups by day.
 * Writes are best-effort by design — a failed counter never breaks a read.
 */
import { pgQuery } from '../postgres.ts';
import { pgOrJson, readStore, writeStore } from './backend.ts';

export type EventType =
  | 'article_view'
  | 'video_play'
  | 'search'
  | 'newsletter_signup'
  | 'tip_submit'
  | 'comment_post'
  | 'save'
  | 'share'
  | 'outbound_click';

export interface EventRow {
  type: EventType;
  refId: string;
  day: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

const STORE = 'events';
const MAX_ROWS = 20_000;

export async function recordEventRepo(type: EventType, refId = '', meta: Record<string, unknown> = {}): Promise<void> {
  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10);
  await pgOrJson(
    'events record',
    async () => {
      await pgQuery('INSERT INTO events (type, ref_id, day, meta, created_at) VALUES ($1,$2,$3,$4,$5)', [
        type,
        refId,
        day,
        JSON.stringify(meta),
        createdAt,
      ]);
    },
    async () => {
      const all = (await readStore<EventRow[]>(STORE))?.value ?? [];
      await writeStore(STORE, [{ type, refId, day, meta, createdAt }, ...all].slice(0, MAX_ROWS));
    },
  );
}

export interface DayBucket {
  day: string;
  views: number;
  videoPlays: number;
  searches: number;
  signups: number;
  comments: number;
}

export interface AnalyticsSummary {
  days: DayBucket[];
  totals: { views: number; videoPlays: number; searches: number; signups: number; comments: number; saves: number };
  refLeaders: Array<{ refId: string; count: number }>;
}

function tally(rows: EventRow[], days: number): AnalyticsSummary {
  const cutoff = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const byDay = new Map<string, DayBucket>();
  const totals = { views: 0, videoPlays: 0, searches: 0, signups: 0, comments: 0, saves: 0 };
  const refs = new Map<string, number>();
  for (const r of rows) {
    if (r.type === 'article_view') totals.views++;
    if (r.type === 'video_play') totals.videoPlays++;
    if (r.type === 'search') totals.searches++;
    if (r.type === 'newsletter_signup') totals.signups++;
    if (r.type === 'comment_post') totals.comments++;
    if (r.type === 'save') totals.saves++;
    if (r.refId && (r.type === 'article_view' || r.type === 'video_play')) {
      refs.set(r.refId, (refs.get(r.refId) ?? 0) + 1);
    }
    if (r.day < cutoff) continue;
    const bucket = byDay.get(r.day) ?? { day: r.day, views: 0, videoPlays: 0, searches: 0, signups: 0, comments: 0 };
    if (r.type === 'article_view') bucket.views++;
    if (r.type === 'video_play') bucket.videoPlays++;
    if (r.type === 'search') bucket.searches++;
    if (r.type === 'newsletter_signup') bucket.signups++;
    if (r.type === 'comment_post') bucket.comments++;
    byDay.set(r.day, bucket);
  }
  const daysArr: DayBucket[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    daysArr.push(byDay.get(day) ?? { day, views: 0, videoPlays: 0, searches: 0, signups: 0, comments: 0 });
  }
  return {
    days: daysArr,
    totals,
    refLeaders: [...refs.entries()]
      .map(([refId, count]) => ({ refId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

/** Aggregate the last `days` of activity (events table + article views). */
export async function analyticsSummaryRepo(days = 14): Promise<AnalyticsSummary> {
  const span = Math.min(90, Math.max(3, days));
  return pgOrJson('events summary', async () => {
    const r = await pgQuery<{ type: EventType; ref_id: string; day: string }>(
      `SELECT type, ref_id, day FROM events WHERE created_at >= now() - ($1 || ' days')::interval`,
      [String(span + 1)],
    );
    const rows: EventRow[] = r.rows.map((x) => ({
      type: x.type,
      refId: x.ref_id ?? '',
      day: x.day,
      meta: {},
      createdAt: x.day,
    }));
    return tally(rows, span);
  }, async () => {
    const rows = (await readStore<EventRow[]>(STORE))?.value ?? [];
    return tally(rows, span);
  });
}
