/**
 * Reader engagement rows: tips + newsletter subscribers.
 * Postgres when configured, else JSON.
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export type TipStatus = 'new' | 'investigating' | 'published' | 'archived';

export interface Tip {
  id: string;
  kind: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
  status?: TipStatus;
  assignedTo?: string;
  adminNote?: string;
  articleId?: string;
}

export interface Subscriber {
  email: string;
  locale: string;
  createdAt: string;
}

const TIPS_STORE = 'tips';
const SUBS_STORE = 'subscribers';

export async function createTipRepo(tip: Tip): Promise<void> {
  if (isPostgresEnabled()) {
    try {
      await pgQuery(
        `INSERT INTO tips (id, kind, name, contact, message, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [tip.id, tip.kind, tip.name, tip.contact, tip.message, tip.createdAt],
      );
      return;
    } catch (err) {
      console.error('[db] tips pg create failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Tip[]>(TIPS_STORE))?.value ?? [];
  await writeStore(TIPS_STORE, [...all, tip].slice(-2000));
}

export async function createSubscriberRepo(sub: Subscriber): Promise<'added' | 'exists'> {
  const email = sub.email.trim().toLowerCase();
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ email: string }>(
        `INSERT INTO subscribers (email, locale, created_at) VALUES ($1,$2,$3)
         ON CONFLICT (email) DO NOTHING RETURNING email`,
        [email, sub.locale, sub.createdAt],
      );
      return r.rows.length > 0 ? 'added' : 'exists';
    } catch (err) {
      console.error('[db] subscribers pg create failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Subscriber[]>(SUBS_STORE))?.value ?? [];
  if (all.some((s) => s.email === email)) return 'exists';
  await writeStore(SUBS_STORE, [...all, { ...sub, email }].slice(-10000));
  return 'added';
}


/* ------------------------------------------------------------------ *
 * Console inboxes: reader tips + newsletter subscribers.              *
 * ------------------------------------------------------------------ */

export async function listTipsRepo(opts: { status?: TipStatus | 'all'; limit?: number } = {}): Promise<Tip[]> {
  const limit = Math.min(500, opts.limit ?? 100);
  if (isPostgresEnabled()) {
    try {
      const rows = opts.status && opts.status !== 'all'
        ? await pgQuery<Record<string, unknown>>(
            'SELECT * FROM tips WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
            [opts.status, limit],
          )
        : await pgQuery<Record<string, unknown>>('SELECT * FROM tips ORDER BY created_at DESC LIMIT $1', [limit]);
      return rows.rows.map(rowToTip);
    } catch (err) {
      console.error('[db] tips pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Tip[]>(TIPS_STORE))?.value ?? [];
  const filtered = opts.status && opts.status !== 'all' ? all.filter((t) => (t.status ?? 'new') === opts.status) : all;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

function rowToTip(r: Record<string, unknown>): Tip {
  return {
    id: String(r.id),
    kind: String(r.kind ?? 'tip'),
    name: String(r.name ?? ''),
    contact: String(r.contact ?? ''),
    message: String(r.message ?? ''),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : new Date().toISOString(),
    status: (String(r.status ?? 'new') as TipStatus),
    ...(r.assigned_to ? { assignedTo: String(r.assigned_to) } : {}),
    ...(r.admin_note ? { adminNote: String(r.admin_note) } : {}),
    ...(r.article_id ? { articleId: String(r.article_id) } : {}),
  };
}

export async function updateTipRepo(
  id: string,
  patch: { status?: TipStatus; assignedTo?: string; adminNote?: string; articleId?: string },
): Promise<boolean> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery(
        `UPDATE tips SET status = COALESCE($2, status), assigned_to = COALESCE($3, assigned_to),
           admin_note = COALESCE($4, admin_note), article_id = COALESCE($5, article_id), updated_at = now()
         WHERE id = $1 RETURNING id`,
        [id, patch.status ?? null, patch.assignedTo ?? null, patch.adminNote ?? null, patch.articleId ?? null],
      );
      if (r.rows[0]) return true;
    } catch (err) {
      console.error('[db] tips pg update failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  const all = (await readStore<Tip[]>(TIPS_STORE))?.value ?? [];
  const tip = all.find((t) => t.id === id);
  if (!tip) return false;
  Object.assign(tip, patch);
  await writeStore(TIPS_STORE, all);
  return true;
}

export async function countTipsByStatusRepo(): Promise<Record<TipStatus, number>> {
  const base: Record<TipStatus, number> = { new: 0, investigating: 0, published: 0, archived: 0 };
  for (const t of await listTipsRepo({ limit: 500 })) base[t.status ?? 'new'] = (base[t.status ?? 'new'] ?? 0) + 1;
  return base;
}

export async function listSubscribersRepo(opts: { limit?: number } = {}): Promise<Subscriber[]> {
  const limit = Math.min(5000, opts.limit ?? 1000);
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ email: string; locale: string; created_at: string }>(
        'SELECT email, locale, created_at FROM subscribers ORDER BY created_at DESC LIMIT $1',
        [limit],
      );
      return r.rows.map((x) => ({ email: x.email, locale: x.locale, createdAt: new Date(x.created_at).toISOString() }));
    } catch (err) {
      console.error('[db] subscribers pg list failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return (await readStore<Subscriber[]>(SUBS_STORE))?.value ?? [];
}

export async function countSubscribersRepo(): Promise<number> {
  if (isPostgresEnabled()) {
    try {
      const r = await pgQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM subscribers');
      return Number(r.rows[0]?.count ?? 0);
    } catch (err) {
      console.error('[db] subscribers pg count failed, falling back to json:', err instanceof Error ? err.message : err);
    }
  }
  return (await readStore<Subscriber[]>(SUBS_STORE))?.value?.length ?? 0;
}
