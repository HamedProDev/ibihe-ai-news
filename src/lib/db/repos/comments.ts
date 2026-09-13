/**
 * Reader comments + moderation (admin). Public reads only ever see
 * status='approved'; the console sees everything.
 */
import { pgQuery } from '../postgres.ts';
import { newId, pgOrJson, readRows, writeRows } from './backend.ts';

export type CommentStatus = 'pending' | 'approved' | 'hidden' | 'spam';

export interface Comment {
  id: string;
  articleId: string;
  parentId?: string;
  userId?: string;
  authorName: string;
  authorEmail: string;
  body: string;
  language: string;
  status: CommentStatus;
  votesUp: number;
  createdAt: string;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationNote?: string;
}

export interface CommentListOpts {
  status?: CommentStatus | 'all';
  articleId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

const STORE = 'comments';
const MAX_ROWS = 5000;

function rowToComment(r: {
  id: string; article_id: string; parent_id: string | null; user_id: string | null;
  author_name: string; author_email: string; body: string; language: string;
  status: string; votes_up: number; created_at: string; moderated_by: string;
  moderated_at: string | null; moderation_note: string;
}): Comment {
  return {
    id: r.id,
    articleId: r.article_id,
    ...(r.parent_id ? { parentId: r.parent_id } : {}),
    ...(r.user_id ? { userId: r.user_id } : {}),
    authorName: r.author_name,
    authorEmail: r.author_email,
    body: r.body,
    language: r.language,
    status: r.status as CommentStatus,
    votesUp: Number(r.votes_up ?? 0),
    createdAt: new Date(r.created_at).toISOString(),
    ...(r.moderated_by ? { moderatedBy: r.moderated_by } : {}),
    ...(r.moderated_at ? { moderatedAt: new Date(r.moderated_at).toISOString() } : {}),
    ...(r.moderation_note ? { moderationNote: r.moderation_note } : {}),
  };
}

const SELECT = `SELECT id, article_id, parent_id, user_id, author_name, author_email, body, language,
  status, votes_up, created_at, moderated_by, moderated_at, moderation_note FROM comments`;

export async function listCommentsRepo(opts: CommentListOpts = {}): Promise<{ items: Comment[]; total: number }> {
  const limit = Math.min(200, opts.limit ?? 50);
  const offset = opts.offset ?? 0;

  const json = async (): Promise<{ items: Comment[]; total: number }> => {
    const all = await readRows<Comment>(STORE);
    const q = (opts.q ?? '').trim().toLowerCase();
    const filtered = all
      .filter((c) => (opts.status && opts.status !== 'all' ? c.status === opts.status : true))
      .filter((c) => (opts.articleId ? c.articleId === opts.articleId : true))
      .filter((c) => (q ? `${c.authorName} ${c.body}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: filtered.slice(offset, offset + limit), total: filtered.length };
  };

  return pgOrJson('comments list', async () => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.status && opts.status !== 'all') {
      params.push(opts.status);
      where.push(`status = $${params.length}`);
    }
    if (opts.articleId) {
      params.push(opts.articleId);
      where.push(`article_id = $${params.length}`);
    }
    if (opts.q) {
      params.push(`%${opts.q.trim()}%`);
      where.push(`(author_name || ' ' || body) ILIKE $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await pgQuery<Parameters<typeof rowToComment>[0]>(
      `${SELECT} ${clause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const total = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM comments ${clause}`, params);
    return { items: rows.rows.map(rowToComment), total: Number(total.rows[0]?.count ?? 0) };
  }, json);
}

export async function createCommentRepo(input: Omit<Comment, 'id' | 'createdAt' | 'votesUp'>): Promise<Comment> {
  const comment: Comment = { ...input, id: newId('c'), createdAt: new Date().toISOString(), votesUp: 0 };
  await pgOrJson('comments create', async () => {
    await pgQuery(
      `INSERT INTO comments (id, article_id, parent_id, user_id, author_name, author_email, body, language, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        comment.id, comment.articleId, comment.parentId ?? null, comment.userId ?? null,
        comment.authorName, comment.authorEmail, comment.body, comment.language, comment.status, comment.createdAt,
      ],
    );
  }, async () => {
    const all = await readRows<Comment>(STORE);
    await writeRows(STORE, [comment, ...all].slice(0, MAX_ROWS));
  });
  return comment;
}

export async function setCommentStatusRepo(
  id: string,
  status: CommentStatus,
  actor: string,
  note?: string,
): Promise<Comment | null> {
  const now = new Date().toISOString();
  const updated = await pgOrJson('comments moderate', async () => {
    const r = await pgQuery<Parameters<typeof rowToComment>[0]>(
      `UPDATE comments SET status = $2, moderated_by = $3, moderated_at = now(), moderation_note = $4
       WHERE id = $1 RETURNING id, article_id, parent_id, user_id, author_name, author_email, body, language,
       status, votes_up, created_at, moderated_by, moderated_at, moderation_note`,
      [id, status, actor, note ?? ''],
    );
    return r.rows[0] ? rowToComment(r.rows[0]) : null;
  }, async () => {
    const all = await readRows<Comment>(STORE);
    const found = all.find((c) => c.id === id);
    if (!found) return null;
    found.status = status;
    found.moderatedBy = actor;
    found.moderatedAt = now;
    if (note) found.moderationNote = note;
    await writeRows(STORE, all);
    return found;
  });
  if (updated) await refreshCommentCount(updated.articleId);
  return updated;
}

export async function deleteCommentRepo(id: string): Promise<boolean> {
  const found = await pgOrJson('comments get-one', async () => {
    const r = await pgQuery<{ article_id: string }>('SELECT article_id FROM comments WHERE id = $1', [id]);
    return r.rows[0]?.article_id ?? null;
  }, async () => (await readRows<Comment>(STORE)).find((c) => c.id === id)?.articleId ?? null);

  const ok = await pgOrJson('comments delete', async () => {
    const r = await pgQuery('DELETE FROM comments WHERE id = $1', [id]);
    return (r.rowCount ?? 0) > 0;
  }, async () => {
    const all = await readRows<Comment>(STORE);
    const next = all.filter((c) => c.id !== id);
    if (next.length === all.length) return false;
    await writeRows(STORE, next);
    return true;
  });
  if (ok && found) await refreshCommentCount(found);
  return ok;
}

/** Recompute the denormalized counter stored on the article document. */
async function refreshCommentCount(articleId: string): Promise<void> {
  try {
    const { getArticleRepo, upsertArticlesRepo } = await import('./articles.ts');
    const article = await getArticleRepo(articleId);
    if (!article) return;
    const { total } = await listCommentsRepo({ articleId, status: 'approved', limit: 1 });
    await upsertArticlesRepo([{ ...article, commentsCount: total }]);
  } catch (err) {
    console.error('[db] comment count refresh failed:', err instanceof Error ? err.message : err);
  }
}

export async function countCommentsByStatusRepo(): Promise<Record<CommentStatus, number>> {
  const base: Record<CommentStatus, number> = { pending: 0, approved: 0, hidden: 0, spam: 0 };
  return pgOrJson('comments counts', async () => {
    const r = await pgQuery<{ status: CommentStatus; count: string }>(
      'SELECT status, COUNT(*)::text AS count FROM comments GROUP BY status',
    );
    for (const row of r.rows) base[row.status] = Number(row.count);
    return base;
  }, async () => {
    for (const c of await readRows<Comment>(STORE)) base[c.status] = (base[c.status] ?? 0) + 1;
    return base;
  });
}
