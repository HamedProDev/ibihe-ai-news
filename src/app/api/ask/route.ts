import { NextRequest } from 'next/server';
import { askIbihe } from '@/lib/ai/ask';
import { ok, err } from '@/lib/api/envelope';

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const question = typeof body === 'object' && body !== null && 'question' in body
      ? String((body as { question: unknown }).question ?? '').trim()
      : '';
    const rawLocale = typeof body === 'object' && body !== null && 'locale' in body
      ? String((body as { locale: unknown }).locale ?? 'rw')
      : 'rw';
    const locale = rawLocale === 'en' ? 'en' : 'rw';

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
