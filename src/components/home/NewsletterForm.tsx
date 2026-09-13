'use client';

import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function NewsletterForm({ idPrefix = 'nl' }: { idPrefix?: string }) {
  const { t, s, locale } = useLocale();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'exists' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { exists?: boolean } };
      if (!json.ok) {
        setState('error');
        return;
      }
      setState(json.data?.exists ? 'exists' : 'done');
      setEmail('');
    } catch {
      setState('error');
    }
  };

  if (state === 'done' || state === 'exists') {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2.5 text-[13px] text-ink/85" role="status">
        <CheckCircle2 size={16} className="shrink-0 text-brand-ink" aria-hidden />
        {t(state === 'done' ? s.newsletter.thanks : s.newsletter.exists)}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={`${idPrefix}-email`} className="sr-only">
        {t(s.newsletter.placeholder)}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Mail size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden />
          <input
            id={`${idPrefix}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(s.newsletter.placeholder)}
            className="w-full rounded-xl border border-ink/15 bg-ink/5 py-2.5 pe-3 ps-9 text-sm text-ink placeholder:text-ink/35 focus:border-brand/60 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={state === 'busy'}
          className="shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-bright disabled:opacity-50"
        >
          {state === 'busy' ? '…' : t(s.newsletter.subscribe)}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs text-danger" role="alert">
          {t(s.states.error)} — {t(s.states.retry)}
        </p>
      )}
    </form>
  );
}
