import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** The console moved to /admin-control — old links get a real 307. */
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const url = new URL('/admin-control', req.url);
  return NextResponse.redirect(url, 307);
}
