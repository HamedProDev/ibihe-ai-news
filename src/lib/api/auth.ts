import type { NextRequest } from 'next/server';

/**
 * Shared-secret gates for operational endpoints.
 *
 * - ADMIN_SECRET: human admin actions (review decisions, CSV import).
 * - CRON_SECRET:  scheduler triggers (ingest, market pull). Vercel Cron
 *   sends `Authorization: Bearer $CRON_SECRET` automatically.
 *
 * This is a deliberate v1: fine for a small trusted team, documented as
 * "replace with Auth.js before multi-admin use" in the runbook.
 */

function bearer(req: NextRequest): string {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return diff === 0;
}

export function requireAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return timingSafeEqual(bearer(req), secret);
}

export function requireCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeEqual(bearer(req), secret);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}
