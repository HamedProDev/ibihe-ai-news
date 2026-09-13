import { NextRequest } from 'next/server';
import { askIbihe } from '@/lib/ai/ask';
import { ok, err } from '@/lib/api/envelope';
import { clientKey, globalLimiter } from '@/lib/api/rate-limit';

const ASK_LIMIT = { limit: 30, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const verdict = globalLimiter.check(clientKey(req, 'ask'), ASK_LIMIT);
  if (!verdict.allowed) {
    const res = err(
      'rate-limited',
      'Wababajije cyane. Tegereza gato wongere.',
      'Too many questions. Please wait a moment and retry.',
      429,
    );
    res.headers.set('Retry-After', String(Math.ceil(verdict.retryAfterMs / 1000)));
    return res;
  }
  try {
    const body: unknown = await req.json().catch(() => null);
    const question = typeof body === 'object' && body !== null && 'question' in body
      ? String((body as { question: unknown }).question ?? '').trim()
      : '';
    const rawLocale = typeof body === 'object' && body !== null && 'locale' in body
      ? String((body as { locale: unknown }).locale ?? 'rw')
      : 'rw';
    // Ask brain answers in rw/en only: Kinyarwanda UI -> rw, everything else -> en.
    const locale = rawLocale === 'rw' ? 'rw' : 'en';

    if (question.length < 3) {
      return err('question-too-short', 'Andika ikibazo kirambuye gato.', 'Please ask a slightly longer question.', 400);
    }
    if (question.length > 500) {
      return err('question-too-long', 'Ikibazo ni kinini. Kigabanye.', 'Question too long. Please shorten it.', 400);
    }

    const answer = await askIbihe(question, locale);
    return ok(answer, 'live');
  } catch (e) {
    console.error('[api/ask]', e);
    return err('ask-failed', 'Ibihe ntibashije gusubiza ubu. Ongera ugerageze.', 'Ibihe could not answer right now. Please retry.');
  }
}
