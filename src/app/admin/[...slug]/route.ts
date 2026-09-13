import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** The console moved to /admin-control — old links get a real 307. */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  const url = new URL(`/admin-control/${slug.map((s) => encodeURIComponent(s)).join('/')}`, req.url);
  url.search = new URL(req.url).search; // keep ?q= and friends
  return NextResponse.redirect(url, 307);
}
