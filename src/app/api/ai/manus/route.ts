import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';
import { isManusConfigured, ManusError, runManusTask } from '@/lib/ai/manus';

/** Manus agent tasks can run long; give serverless room (Vercel maxDuration). */
export const maxDuration = 120;

const LIMIT = { limit: 10, windowMs: 60_000 };

/**
 * Run a Manus agent task and wait for the result (up to ~105s).
 * Body: { prompt: string, locale?: 'rw' | 'en' }.
 * Requires MANUS_API_KEY on the server — 503 with setup hint otherwise.
 */
export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'ai-manus'), LIMIT);
  if (!verdict.allowed) {
    const res = err('rate-limited', 'Wagerageje inshuro nyinshi. Tegereza gato.', 'Too many requests. Wait a moment.', 429);
    res.headers.set('Retry-After', String(Math.ceil(verdict.retryAfterMs / 1000)));
    return res;
  }
  if (!isManusConfigured()) {
    return err(
      'manus-disabled',
      'Manus AI ntirikora. Shyira MANUS_API_KEY kuri server.',
      'Manus AI is not configured. Set MANUS_API_KEY on the server (manus.im/app → Settings → Integrations → API).',
      503,
    );
  }
  try {
    const body = (await req.json().catch(() => null)) as { prompt?: unknown; locale?: unknown } | null;
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const locale = body?.locale === 'rw' ? 'rw' : 'en';
    if (prompt.length < 3) {
      return err('prompt-too-short', 'Andika icyo ushaka gato.', 'Please write a slightly longer prompt.', 400);
    }
    if (prompt.length > 4000) {
      return err('prompt-too-long', 'Prompt ni ndende (max 4000).', 'Prompt too long (max 4000 chars).', 400);
    }
    const result = await runManusTask(prompt, { locale });
    return ok(result, 'live');
  } catch (e) {
    if (e instanceof ManusError) {
      console.error('[api/ai/manus]', e.code, e.message);
      const status = e.code === 'permission_denied' || e.code === 'unauthorized' ? 502 : 502;
      return err('manus-failed', 'Manus AI yananiwe gusubiza. Ongera ugerageze.', `Manus request failed: ${e.message}`, status);
    }
    console.error('[api/ai/manus]', e);
    return err('manus-failed', 'Manus AI yananiwe gusubiza. Ongera ugerageze.', 'Manus request failed. Please retry.');
  }
}
