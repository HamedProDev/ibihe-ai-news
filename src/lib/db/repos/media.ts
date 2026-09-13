/**
 * Media library (admin). Images can be uploaded (kept inline as a data URL and
 * streamed back through /api/media/[id]) or referenced by URL. Videos are
 * ALWAYS references — the newsroom embeds players, it never hosts bytes.
 */
import { pgQuery } from '../postgres.ts';
import { newId, pgOrJson, readRows, writeRows } from './backend.ts';

export type MediaKind = 'image' | 'video' | 'audio' | 'document';
export type MediaStorage = 'inline' | 'url';

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  mime: string;
  /** Direct URL (empty for inline uploads — use /api/media/[id]). */
  url: string;
  thumbUrl: string;
  alt: string;
  caption: string;
  credit: string;
  width?: number;
  height?: number;
  bytes: number;
  storage: MediaStorage;
  /** base64 payload for inline uploads (never leaves the server). */
  data?: string;
  usedBy?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface MediaListOpts {
  kind?: MediaKind | 'all';
  q?: string;
  limit?: number;
  offset?: number;
}

/** Public path an <img>/editor should use for a stored asset. */
export function mediaPublicUrl(asset: Pick<MediaAsset, 'storage' | 'url' | 'id'>): string {
  if (asset.storage === 'inline' || !asset.url) return `/api/media/${asset.id}`;
  return asset.url;
}

const STORE = 'media';
const MAX_ROWS = 400;

function rowToAsset(r: Record<string, unknown>): MediaAsset {
  const d = (r.data ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    kind: String(r.kind) as MediaKind,
    mime: String(r.mime ?? ''),
    url: String(r.url ?? ''),
    thumbUrl: String(r.thumb_url ?? ''),
    alt: String(r.alt ?? ''),
    caption: String(r.caption ?? ''),
    credit: String(r.credit ?? ''),
    ...(r.width != null ? { width: Number(r.width) } : {}),
    ...(r.height != null ? { height: Number(r.height) } : {}),
    bytes: Number(r.bytes ?? 0),
    storage: (String(r.storage ?? 'url') as MediaStorage),
    ...(typeof d.data === 'string' ? { data: d.data } : {}),
    ...(typeof d.usedBy === 'string' ? { usedBy: d.usedBy } : {}),
    uploadedBy: String(r.uploaded_by ?? ''),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

export async function listMediaRepo(opts: MediaListOpts = {}): Promise<{ items: MediaAsset[]; total: number }> {
  const limit = Math.min(200, opts.limit ?? 60);
  const offset = opts.offset ?? 0;
  const q = (opts.q ?? '').trim().toLowerCase();

  const json = async (): Promise<{ items: MediaAsset[]; total: number }> => {
    const all = await readRows<MediaAsset>(STORE);
    const filtered = all.filter((m) => {
      if (opts.kind && opts.kind !== 'all' && m.kind !== opts.kind) return false;
      if (q && !`${m.alt} ${m.caption} ${m.credit} ${m.url} ${m.id}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return {
      items: filtered.slice(offset, offset + limit).map((m) => ({ ...m, data: undefined })),
      total: filtered.length,
    };
  };

  return pgOrJson('media list', async () => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.kind && opts.kind !== 'all') {
      params.push(opts.kind);
      where.push(`kind = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(alt || ' ' || caption || ' ' || credit || ' ' || url) ILIKE $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await pgQuery<Record<string, unknown>>(
      `SELECT id, kind, mime, url, thumb_url, alt, caption, credit, width, height, bytes, storage, uploaded_by, created_at, data
       FROM media_assets ${clause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const total = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM media_assets ${clause}`, params);
    return { items: rows.rows.map(rowToAsset), total: Number(total.rows[0]?.count ?? 0) };
  }, json);
}

/** Full record including the inline payload (server-side only). */
export async function getMediaRepo(id: string): Promise<MediaAsset | null> {
  return pgOrJson('media get', async () => {
    const r = await pgQuery<Record<string, unknown>>(
      `SELECT id, kind, mime, url, thumb_url, alt, caption, credit, width, height, bytes, storage, uploaded_by, created_at, data
       FROM media_assets WHERE id = $1`,
      [id],
    );
    return r.rows[0] ? rowToAsset(r.rows[0]) : null;
  }, async () => (await readRows<MediaAsset>(STORE)).find((m) => m.id === id) ?? null);
}

export async function createMediaRepo(asset: Omit<MediaAsset, 'id' | 'createdAt'> & { id?: string }): Promise<MediaAsset> {
  const full: MediaAsset = {
    ...asset,
    id: asset.id ?? newId('m'),
    createdAt: new Date().toISOString(),
  };
  await pgOrJson('media create', async () => {
    await pgQuery(
      `INSERT INTO media_assets (id, kind, mime, url, thumb_url, alt, caption, credit, width, height, bytes, storage, uploaded_by, created_at, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, thumb_url = EXCLUDED.thumb_url, alt = EXCLUDED.alt,
         caption = EXCLUDED.caption, credit = EXCLUDED.credit, bytes = EXCLUDED.bytes, data = EXCLUDED.data`,
      [
        full.id, full.kind, full.mime, full.url, full.thumbUrl, full.alt, full.caption, full.credit,
        full.width ?? null, full.height ?? null, full.bytes, full.storage, full.uploadedBy, full.createdAt,
        JSON.stringify({ ...(full.data ? { data: full.data } : {}), ...(full.usedBy ? { usedBy: full.usedBy } : {}) }),
      ],
    );
  }, async () => {
    const all = await readRows<MediaAsset>(STORE);
    await writeRows(STORE, [full, ...all.filter((m) => m.id !== full.id)].slice(0, MAX_ROWS));
  });
  return full;
}

export async function deleteMediaRepo(id: string): Promise<boolean> {
  return pgOrJson('media delete', async () => {
    const r = await pgQuery('DELETE FROM media_assets WHERE id = $1 RETURNING id', [id]);
    return r.rowCount ? r.rowCount > 0 : false;
  }, async () => {
    const all = await readRows<MediaAsset>(STORE);
    const next = all.filter((m) => m.id !== id);
    if (next.length === all.length) return false;
    await writeRows(STORE, next);
    return true;
  });
}

export async function countMediaRepo(): Promise<number> {
  return pgOrJson('media count', async () => {
    const r = await pgQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM media_assets');
    return Number(r.rows[0]?.count ?? 0);
  }, async () => (await readRows<MediaAsset>(STORE)).length);
}
