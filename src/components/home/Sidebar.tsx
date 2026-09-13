'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bot, PenLine, Send } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import NewsCard from '@/components/news/NewsCard';
import type { Article } from '@/types';

interface BriefingBullet {
  articleId: string;
  textKiny: string;
  textEn: string;
}

interface AuthorRow {
  id: string;
  name: string;
  role: string;
  beat?: string | null;
  articleCount: number;
}

interface SourceRow {
  id: string;
  name: string;
}

function readData<T>(json: unknown, key: string): T[] {
  if (!json || typeof json !== 'object') return [];
  const data = (json as Record<string, unknown>).data as Record<string, unknown> | undefined;
  const list = data?.[key];
  return Array.isArray(list) ? (list as T[]) : [];
}

function Card({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section aria-label={label} className="rounded-2xl border border-ink/10 bg-surface p-4">
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 border-b border-ink/10 pb-2 text-sm font-bold uppercase tracking-wide text-ink">{children}</h2>;
}

function BriefingWidget() {
  const { t, s, locale } = useLocale();
  const [bullets, setBullets] = useState<BriefingBullet[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/briefing')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (!alive) return;
        if (json && typeof json === 'object') {
          const data = (json as Record<string, unknown>).data as { bullets?: BriefingBullet[] } | undefined;
          setBullets(Array.isArray(data?.bullets) ? data.bullets.slice(0, 3) : []);
        }
      })
      .catch(() => {
        if (alive) setBullets([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!bullets || bullets.length === 0) return null;
  return (
    <Card label={t(s.sidebar.aiSummary)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-brand/15 text-brand-ink">
          <Bot size={18} aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink">{t(s.sidebar.aiSummary)}</h2>
          <p className="text-[11px] text-ink/45">{t(s.sidebar.poweredByEditors)}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {bullets.map((b) => (
          <li key={b.articleId}>
            <Link
              href={`/amakuru/${b.articleId}`}
              className="block rounded-lg bg-ink/[0.04] p-2.5 text-[13px] leading-snug text-ink/80 hover:bg-ink/[0.07] hover:text-ink"
            >
              {locale === 'rw' ? b.textKiny : b.textEn}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/briefing"
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink hover:underline"
      >
        {t(s.sidebar.readBrief)}
        <ArrowRight size={13} aria-hidden className="rtl:rotate-180" />
      </Link>
    </Card>
  );
}

function TopStories({ articles }: { articles: Article[] }) {
  const { t, s } = useLocale();
  if (articles.length === 0) return null;
  return (
    <Card label={t(s.sidebar.topStories)}>
      <CardTitle>{t(s.sidebar.topStories)}</CardTitle>
      <div className="divide-y divide-ink/5">
        {articles.map((a) => (
          <NewsCard key={a.id} article={a} variant="minimal" />
        ))}
      </div>
    </Card>
  );
}

function TopAuthors() {
  const { t, s } = useLocale();
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/authors')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (alive) setAuthors(readData<AuthorRow>(json, 'authors').slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (authors.length === 0) return null;
  return (
    <Card label={t(s.sidebar.topAuthors)}>
      <CardTitle>{t(s.sidebar.topAuthors)}</CardTitle>
      <ul className="space-y-2.5">
        {authors.map((a) => (
          <li key={a.id} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand-ink"
            >
              {a.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{a.name}</span>
              <span className="block text-xs text-ink/45">
                {a.articleCount} {t(s.sidebar.articles)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function VerifiedSources() {
  const { t, s } = useLocale();
  const [sources, setSources] = useState<SourceRow[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/sources')
      .then((r) => r.json())
      .then((json: unknown) => {
        if (alive) setSources(readData<SourceRow>(json, 'sources').slice(0, 6));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (sources.length === 0) return null;
  return (
    <Card label={t(s.sidebar.verifiedSources)}>
      <CardTitle>{t(s.sidebar.verifiedSources)}</CardTitle>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((src) => (
          <li
            key={src.id}
            className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-1 text-xs text-ink/70"
          >
            <BadgeCheck size={12} className="text-brand-ink" aria-hidden />
            {src.name}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TipForm() {
  const { t, s } = useLocale();
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, contact, kind: 'news' }),
      });
      const json = (await res.json()) as { ok: boolean };
      setState(json.ok ? 'done' : 'error');
      if (json.ok) {
        setMessage('');
        setContact('');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <Card label={t(s.sidebar.submitTip)}>
      <CardTitle>{t(s.sidebar.submitTip)}</CardTitle>
      <p className="mb-3 text-[13px] leading-relaxed text-ink/55">{t(s.sidebar.submitTipDesc)}</p>
      {state === 'done' ? (
        <p className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2.5 text-[13px] text-ink/85" role="status">
          {t(s.sidebar.tipThanks)}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <label className="sr-only" htmlFor="tip-message">{t(s.sidebar.tipPlaceholder)}</label>
          <textarea
            id="tip-message"
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(s.sidebar.tipPlaceholder)}
            className="w-full resize-none rounded-xl border border-ink/15 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-brand/60 focus:outline-none"
          />
          <label className="sr-only" htmlFor="tip-contact">{t(s.sidebar.tipContact)}</label>
          <input
            id="tip-contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t(s.sidebar.tipContact)}
            className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-brand/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === 'busy'}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-bright disabled:opacity-50"
          >
            <Send size={14} aria-hidden />
            {state === 'busy' ? '…' : t(s.sidebar.submitTip)}
          </button>
          {state === 'error' && (
            <p className="text-xs text-danger" role="alert">{t(s.states.error)} — {t(s.states.retry)}</p>
          )}
        </form>
      )}
    </Card>
  );
}

function ContributorCard() {
  const { t, s } = useLocale();
  return (
    <section
      aria-label={t(s.sidebar.contributor)}
      className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/15 to-transparent p-4"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
        <PenLine size={15} className="text-brand-ink" aria-hidden />
        {t(s.sidebar.contributor)}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">{t(s.sidebar.contributorDesc)}</p>
      <Link
        href="/contact"
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-brand/50 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand/10"
      >
        {t(s.sidebar.applyNow)}
        <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
      </Link>
    </section>
  );
}

export function Sidebar({ topStories = [] }: { topStories?: Article[] }) {
  return (
    <aside className="flex flex-col gap-4 xl:sticky xl:top-[9.75rem] xl:self-start">
      <BriefingWidget />
      <TopStories articles={topStories} />
      <TopAuthors />
      <VerifiedSources />
      <TipForm />
      <ContributorCard />
    </aside>
  );
}
