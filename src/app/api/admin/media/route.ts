import type { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { needStaff } from '@/lib/api/admin-guard';
import { createMediaRepo, deleteMediaRepo, listMediaRepo, type MediaKind } from '@/lib/db/repos/media';
import { getSiteSettingsRepo } from '@/lib/db/repos/settings';
import { recordAuditRepo } from '@/lib/db/repos/audit';

const KINDS = new Set<MediaKind>(['image', 'video', 'audio', 'document']);

/** Media library listing (?kind=&q=&limit=&offset=). */
export async function GET(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const sp = new URL(req.url).searchParams;
    const kind = (sp.get('kind') ?? 'all') as MediaKind | 'all';
    const result = await listMediaRepo({
      kind: KINDS.has(kind as MediaKind) ? kind : 'all',
      q: (sp.get('q') ?? '').trim() || undefined,
      limit: Math.min(200, Math.max(1, Number(sp.get('limit') ?? 60) || 60)),
      offset: Math.max(0, Number(sp.get('offset') ?? 0) || 0),
    });
    return ok(result, 'live');
  } catch (e) {
    console.error('[api/admin/media GET]', e);
    return err('media-list-failed', 'Dosiye ntizibonetse.', 'Could not list media.');
  }
}

/**
 * Register media. Either JSON ({ url, kind, alt, caption, credit }) or
 * multipart form-data with a `file` part (stored inline, capped by
 * settings.uploads.maxKb). Video is always referenced, never uploaded.
 */
export async function POST(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const settings = await getSiteSettingsRepo();
    const maxBytes = Math.max(64, settings.uploads.maxKb) * 1024;
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return err('no-file', 'Nta dosiye yoherejwe.', 'No file part.', 400);
      const kindRaw = String(form.get('kind') ?? 'image');
      const kind: MediaKind = KINDS.has(kindRaw as MediaKind) ? (kindRaw as MediaKind) : 'image';
      if (kind === 'video') {
        return err(
          'no-video-upload',
          'Amavideo yandikwa nk’ihuza (URL/embed), ntihakirwa hano.',
          'Videos are embedded by URL — file uploads are for images and documents.',
          400,
        );
      }
      if (file.size > maxBytes) {
        return err(
          'too-large',
          `Dosiye nini kurusha ${Math.round(maxBytes / 1024)} KB.`,
          `File is larger than ${Math.round(maxBytes / 1024)} KB.`,
          413,
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = file.type || 'application/octet-stream';
      if (!/^(image\/(jpeg|png|webp|gif|avif)|application\/pdf|text\/)/.test(mime)) {
        return err('bad-type', 'Ubwoko bwa dosiye ntibwemewe.', 'Unsupported file type.', 400);
      }
      const asset = await createMediaRepo({
        kind,
        mime,
        url: '',
        thumbUrl: '',
        alt: String(form.get('alt') ?? '').slice(0, 200),
        caption: String(form.get('caption') ?? '').slice(0, 400),
        credit: String(form.get('credit') ?? '').slice(0, 160),
        bytes: file.size,
        storage: 'inline',
        data: `data:${mime};base64,${buf.toString('base64')}`,
        uploadedBy: g.user?.email ?? 'staff',
      });
      await recordAuditRepo(g.user, 'media.upload', 'media', asset.id, `${file.name} (${Math.round(file.size / 1024)} KB)`);
      // The base64 payload never leaves the server.
      return ok({ asset: { ...asset, data: undefined } }, 'live', { status: 201 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return err('bad-request', 'Nta cyoherejwe.', 'Empty body.', 400);
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const kindRaw = typeof body.kind === 'string' ? body.kind : 'image';
    const kind: MediaKind = KINDS.has(kindRaw as MediaKind) ? (kindRaw as MediaKind) : 'image';
    let url = '';
    let storage: 'inline' | 'url' = 'url';
    if (rawUrl.startsWith('/api/media/')) {
      url = rawUrl;
      storage = 'inline';
    } else {
      try {
        const u = new URL(rawUrl);
        if (u.protocol !== 'https:') throw new Error('https');
        url = u.toString();
      } catch {
        return err('bad-url', 'URL igomba kuba HTTPS.', 'url must be a valid https URL.', 400);
      }
    }
    const num = (v: unknown): number | undefined => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : undefined);
    const asset = await createMediaRepo({
      kind,
      mime: typeof body.mime === 'string' ? body.mime.slice(0, 80) : '',
      url,
      thumbUrl: typeof body.thumbUrl === 'string' ? body.thumbUrl.slice(0, 1000) : '',
      alt: typeof body.alt === 'string' ? body.alt.slice(0, 200) : '',
      caption: typeof body.caption === 'string' ? body.caption.slice(0, 400) : '',
      credit: typeof body.credit === 'string' ? body.credit.slice(0, 160) : '',
      bytes: num(body.bytes) ?? 0,
      storage,
      width: num(body.width),
      height: num(body.height),
      uploadedBy: g.user?.email ?? 'staff',
    });
    await recordAuditRepo(g.user, 'media.link', 'media', asset.id, url.slice(0, 80));
    return ok({ asset }, 'live', { status: 201 });
  } catch (e) {
    console.error('[api/admin/media POST]', e);
    return err('media-create-failed', 'Dosiye ntiyabitswe.', 'Could not save media.');
  }
}

/** Delete an asset (?id=). */
export async function DELETE(req: NextRequest) {
  const g = await needStaff(req);
  if (g.res) return g.res;
  try {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    if (!id) return err('bad-request', 'id irakenewe.', 'id query param is required.', 400);
    const removed = await deleteMediaRepo(id);
    if (!removed) return err('not-found', 'Dosiye ntibonetse.', 'Media not found.', 404);
    await recordAuditRepo(g.user, 'media.delete', 'media', id, 'deleted');
    return ok({ deleted: id }, 'live');
  } catch (e) {
    console.error('[api/admin/media DELETE]', e);
    return err('media-delete-failed', 'Dosiye ntisibwe.', 'Could not delete media.');
  }
}
