/**
 * Audit trail — append-only record of console mutations. Never edited,
 * never deleted by the app; retention is an ops decision.
 */
import { pgQuery } from '../postgres.ts';
import { pgOrJson, readStore, writeStore } from './backend.ts';

export interface AuditEntry {
  id?: number;
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

const STORE = 'audit-log';
const MAX_ROWS = 3000;

/** Fire-and-forget: an audit write must never fail the user's action. */
export async function recordAuditRepo(
  actor: { id: string; email: string; name?: string } | null,
  action: string,
  entity: string,
  entityId: string,
  summary: string,
): Promise<void> {
  const entry: AuditEntry = {
    actorId: actor?.id ?? '',
    actorEmail: actor?.email ?? '',
    action,
    entity,
    entityId,
    summary: summary.slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  try {
    await pgOrJson(
      'audit record',
      async () => {
        await pgQuery(
          'INSERT INTO audit_log (actor_id, actor_email, action, entity, entity_id, summary, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [entry.actorId, entry.actorEmail, entry.action, entry.entity, entry.entityId, entry.summary, entry.createdAt],
        );
      },
      async () => {
        const all = (await readStore<AuditEntry[]>(STORE))?.value ?? [];
        await writeStore(STORE, [entry, ...all].slice(0, MAX_ROWS));
      },
    );
  } catch (err) {
    console.error('[db] audit write failed:', err instanceof Error ? err.message : err);
  }
}

export async function listAuditRepo(opts: { limit?: number; entity?: string } = {}): Promise<AuditEntry[]> {
  const limit = Math.min(200, opts.limit ?? 50);
  return pgOrJson('audit list', async () => {
    const params: unknown[] = [];
    let clause = '';
    if (opts.entity) {
      params.push(opts.entity);
      clause = `WHERE entity = $1`;
    }
    params.push(limit);
    const r = await pgQuery<{
      id: number; actor_id: string; actor_email: string; action: string;
      entity: string; entity_id: string; summary: string; created_at: string;
    }>(
      `SELECT id, actor_id, actor_email, action, entity, entity_id, summary, created_at
       FROM audit_log ${clause} ORDER BY created_at DESC LIMIT $${params.length}`,
      params,
    );
    return r.rows.map((x) => ({
      id: Number(x.id),
      actorId: x.actor_id,
      actorEmail: x.actor_email,
      action: x.action,
      entity: x.entity,
      entityId: x.entity_id,
      summary: x.summary,
      createdAt: new Date(x.created_at).toISOString(),
    }));
  }, async () => {
    const all = (await readStore<AuditEntry[]>(STORE))?.value ?? [];
    const filtered = opts.entity ? all.filter((a) => a.entity === opts.entity) : all;
    return filtered.slice(0, limit);
  });
}
