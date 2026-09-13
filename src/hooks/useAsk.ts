'use client';

import { useCallback, useState } from 'react';
import { ApiError, fetchJson } from '@/lib/client/api';
import type { AskAnswer } from '@/types/ask';
import { useLocale } from '@/components/i18n/LanguageProvider';

export interface AskMessage {
  role: 'user' | 'ibihe';
  text: string;
  answer?: AskAnswer;
}

export function useAsk() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;
      setLoading(true);
      setError(null);
      setMessages((m) => [...m, { role: 'user', text: q }]);
      try {
        const { data } = await fetchJson<AskAnswer>('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, locale }),
        });
        setMessages((m) => [...m, { role: 'ibihe', text: locale === 'rw' ? data.answerKiny : data.answerEn, answer: data }]);
      } catch (e) {
        setError(e instanceof ApiError ? e : new ApiError('network', 'Ntibashoboye guhuza na seriveri.', 'Could not reach the server.'));
      } finally {
        setLoading(false);
      }
    },
    [loading, locale],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, ask, clear };
}
