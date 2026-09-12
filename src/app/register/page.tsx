'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { s, locale } = useLocale();
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { user: { role: string } };
        error?: { messageKiny: string; messageEn: string };
      };
      if (!json.ok || !json.data) {
        setError(locale === 'rw' ? (json.error?.messageKiny ?? '') : (json.error?.messageEn ?? ''));
        return;
      }
      await refresh();
      router.push(json.data.user.role === 'admin' ? '/admin/articles' : '/');
      router.refresh();
    } catch {
      setError(locale === 'rw' ? 'Habaye ikosa.' : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h1 className="text-white font-bold text-xl mb-1">{locale === 'rw' ? s.auth.register.rw : s.auth.register.en}</h1>
        <p className="text-white/50 text-[13px] mb-5">
          {locale === 'rw' ? s.auth.registerSubtitle.rw : s.auth.registerSubtitle.en}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-white/60 text-[13px]">{locale === 'rw' ? s.auth.name.rw : s.auth.name.en}</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c853]/60"
            />
          </label>
          <label className="block">
            <span className="text-white/60 text-[13px]">{locale === 'rw' ? s.auth.email.rw : s.auth.email.en}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c853]/60"
            />
          </label>
          <label className="block">
            <span className="text-white/60 text-[13px]">
              {locale === 'rw' ? s.auth.password.rw : s.auth.password.en} (8+)
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c853]/60"
            />
          </label>
          {error && <p className="text-red-400 text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#00c853] text-black text-sm font-semibold rounded-xl py-2.5 hover:bg-[#00e65f] disabled:opacity-40"
          >
            {busy ? '…' : locale === 'rw' ? s.auth.createAccount.rw : s.auth.createAccount.en}
          </button>
        </form>
        <p className="text-white/50 text-[13px] mt-4 text-center">
          {locale === 'rw' ? s.auth.haveAccount.rw : s.auth.haveAccount.en}{' '}
          <Link href="/login" className="text-[#00c853] hover:underline">
            {locale === 'rw' ? s.auth.login.rw : s.auth.login.en}
          </Link>
        </p>
      </div>
    </main>
  );
}
