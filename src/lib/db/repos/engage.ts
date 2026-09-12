/**
 * Reader engagement rows: tips + newsletter subscribers.
 * Postgres when configured, else JSON.
 */
import { readStore, writeStore } from '../json-store.ts';
import { isPostgresEnabled, pgQuery } from '../postgres.ts';

export interface Tip {
  id: string;
  kind: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
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
