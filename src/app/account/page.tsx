'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, LogOut } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { LOCALE_META, type Locale } from '@/lib/i18n/dictionaries';
import { useAuth } from '@/hooks/useAuth';
import { loadSaved, type SavedStory } from '@/lib/news/saved';
import { LoadingSkeleton } from '@/components/ui/States';
import { timeAgo } from '@/lib/i18n/timeago';

export default function AccountPage() {
  const { t, s, locale, setLocale } = useLocale();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  // Lazy init reads device storage (safe on server: loadSaved catches).
  const [saved] = useState<SavedStory[]>(() => loadSaved());
  const [langBusy, setLangBusy] = useState(false);
  const [langDone, setLangDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/account');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <LoadingSkeleton lines={4} label={t(s.states.loading)} />
      </main>
    );
  }

  const changeLanguage = async (next: Locale) => {
    setLocale(next);
    setLangDone(false);
    setLangBusy(true);
    try {
      await fetch('/api/me/locale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      setLangDone(true);
    } catch {
      /* local switch still applies */
    } finally {
      setLangBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 border-s-4 border-brand ps-3 text-xl font-bold text-ink">{t(s.account.title)}</h1>

      <section aria-label={t(s.account.title)} className="mb-4 rounded-2xl border border-ink/10 bg-surface p-5">
        <p className="text-lg font-bold text-ink">{user.name || user.email}</p>
        <p className="text-sm text-ink/50">{user.email}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-ink/60">
            {t(s.account.role)}: {user.role}
          </span>
          <span className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-ink/60">
            {t(s.account.memberSince)} {timeAgo(user.createdAt, locale)}
          </span>
        </div>

        <label className="mt-4 block max-w-xs">
          <span className="mb-1 block text-[13px] font-medium text-ink/60">{t(s.auth.primaryLanguage)}</span>
          <select
            value={locale}
            onChange={(e) => void changeLanguage(e.target.value as Locale)}
            disabled={langBusy}
            className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2.5 text-sm text-ink focus:border-brand/60 focus:outline-none [&>option]:bg-surface"
          >
            {LOCALE_META.map((m) => (
              <option key={m.code} value={m.code}>
                {m.flag} {m.label}
              </option>
            ))}
          </select>
          {langDone && <span className="mt-1 block text-xs text-brand-ink">{t(s.account.languageUpdated)}</span>}
        </label>

        {(user.role === 'admin' || user.role === 'author') && (
          <Link
            href="/admin-control/articles"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-brand/50 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand/10"
          >
            {t(s.admin.title)}
          </Link>
        )}
        <div>
          <button
            onClick={() => void logout().then(() => router.push('/'))}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:border-ink/30 hover:text-ink"
          >
            <LogOut size={14} aria-hidden />
            {t(s.auth.logout)}
          </button>
        </div>
      </section>

      <section aria-label={t(s.account.savedStories)} className="rounded-2xl border border-ink/10 bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
          <Bookmark size={15} className="text-brand-ink" aria-hidden />
          {t(s.account.savedStories)}
        </h2>
        {saved.length === 0 ? (
          <p className="text-sm text-ink/50">{t(s.account.noSaved)}</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {saved.map((story) => (
              <li key={story.id}>
                <Link href={`/amakuru/${story.id}`} className="group block py-2.5">
                  <span className="block text-sm font-medium leading-snug text-ink/85 group-hover:text-brand-ink line-clamp-2">
                    {locale === 'rw' ? story.titleKiny : story.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/40">
                    {story.sourceName} • {timeAgo(story.publishedAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
