import type { NextRequest } from 'next/server';
import { err } from '@/lib/api/envelope';
import { getMediaRepo, type MediaAsset } from '@/lib/db/repos/media';

/**
 * Streams an inline-uploaded asset. Public because <img> tags cannot carry an
 * auth header; only storage='inline' rows are served and external references
 are never proxied. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const asset: MediaAsset | null = await getMediaRepo(id);
    if (!asset || asset.storage !== 'inline' || !asset.data) {
      return err('not-found', 'Dosiye ntibonetse.', 'Media not found.', 404);
    }
    const comma = asset.data.indexOf(',');
    const payload = comma >= 0 ? asset.data.slice(comma + 1) : asset.data;
    const body = Buffer.from(payload, 'base64');
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': asset.mime || 'application/octet-stream',
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: `"${id}"`,
      },
    });
  } catch (e) {
    console.error('[api/media/[id]]', e);
    return err('media-read-failed', 'Dosiye ntisomwe.', 'Could not read media.');
  }
}
