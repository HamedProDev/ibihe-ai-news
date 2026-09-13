'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { isLocale } from '@/lib/i18n/dictionaries';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const { t, s, locale, setLocale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { user: { role: string; locale?: string } };
        error?: { messageKiny: string; messageEn: string };
      };
      if (!json.ok || !json.data) {
        setError(locale === 'rw' ? (json.error?.messageKiny ?? '') : (json.error?.messageEn ?? ''));
        return;
      }
      if (isLocale(json.data.user.locale)) setLocale(json.data.user.locale);
      await refresh();
      const next = params.get('next');
      router.push(next && next.startsWith('/') ? next : json.data.user.role === 'admin' ? '/admin-control/articles' : '/');
      router.refresh();
    } catch {
      setError(locale === 'rw' ? 'Habaye ikosa.' : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-surface border border-ink/10 rounded-2xl p-6">
        <h1 className="text-ink font-bold text-xl mb-1">{t(s.auth.login)}</h1>
        <p className="text-ink/50 text-[13px] mb-5">
          {t(s.auth.loginSubtitle)}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-ink/60 text-[13px]">{t(s.auth.email)}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-ink/5 border border-ink/15 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/60"
            />
          </label>
          <label className="block">
            <span className="text-ink/60 text-[13px]">{t(s.auth.password)}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-ink/5 border border-ink/15 rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/60"
            />
          </label>
          {error && <p className="text-danger text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand text-on-brand text-sm font-semibold rounded-xl py-2.5 hover:bg-brand-bright disabled:opacity-40"
          >
            {busy ? '…' : t(s.auth.login)}
          </button>
        </form>
        <p className="text-ink/50 text-[13px] mt-4 text-center">
          {t(s.auth.noAccount)}{' '}
          <Link href="/register" className="text-brand-ink hover:underline">
            {t(s.auth.register)}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
