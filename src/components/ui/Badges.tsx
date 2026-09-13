'use client';

import { BadgeCheck, Bot, FlaskConical, Radio } from 'lucide-react';
import type { AIGeneration, ContentStatus, DataMode } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';

const STATUS_STYLES: Record<ContentStatus, string> = {
  verified: 'bg-emerald-500/15 text-ok border-emerald-500/30',
  developing: 'bg-amber-500/15 text-warn border-amber-500/30',
  'multi-source': 'bg-blue-500/15 text-info border-blue-500/30',
  analysis: 'bg-purple-500/15 text-accent border-purple-500/30',
  forecast: 'bg-cyan-500/15 text-info border-cyan-500/30',
  opinion: 'bg-ink/10 text-ink/60 border-ink/20',
};

export function ContentStatusBadge({ status, size = 'sm' }: { status: ContentStatus; size?: 'xs' | 'sm' }) {
  const { t, s} = useLocale();
  const label = t(s.status[status]);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${STATUS_STYLES[status]} ${
        size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      }`}
    >
      {status === 'verified' && <BadgeCheck size={11} aria-hidden="true" />}
      {status === 'developing' && <Radio size={11} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function AIBadge({ ai, size = 'sm' }: { ai: AIGeneration; size?: 'xs' | 'sm' }) {
  const { t, s} = useLocale();
  const label = ai.isRuleBased
    ? t(s.ai.ruleBased)
    : t(s.ai.generated);
  const title = `${ai.model} · ${ai.promptVersion} · ${ai.generatedAt.slice(0, 10)} · ${
    ai.reviewStatus === 'reviewed' ? (t(s.ai.reviewed)) : t(s.ai.unreviewed)
  }`;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border bg-brand/10 text-brand-ink border-brand/25 font-medium ${
        size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      }`}
    >
      <Bot size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

export function CategoryBadge({ category, label }: { category: string; label: string }) {
  const colors: Record<string, string> = {
    rwanda: 'bg-emerald-500/15 text-ok border-emerald-500/30',
    amahanga: 'bg-cyan-500/15 text-info border-cyan-500/30',
    ubukungu: 'bg-blue-500/15 text-info border-blue-500/30',
    politiki: 'bg-red-500/15 text-danger border-red-500/30',
    ikoranabuhanga: 'bg-violet-500/15 text-accent border-violet-500/30',
    ubuzima: 'bg-teal-500/15 text-ok border-teal-500/30',
    uburezi: 'bg-amber-500/15 text-warn border-amber-500/30',
    imyidagaduro: 'bg-pink-500/15 text-accent border-pink-500/30',
    imikino: 'bg-orange-500/15 text-alert border-orange-500/30',
    umuco: 'bg-fuchsia-500/15 text-accent border-fuchsia-500/30',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${colors[category] ?? 'bg-ink/10 text-ink/60 border-ink/20'}`}>
      {label}
    </span>
  );
}

/** Honest banner shown whenever demo/illustrative data is displayed. */
export function DemoBanner({ mode }: { mode: DataMode }) {
  const { t, s} = useLocale();
  if (mode === 'live') return null;
  return (
    <div role="note" className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5 mb-4">
      <FlaskConical size={15} className="text-warn mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-warn/90 text-xs leading-relaxed">
        <strong className="font-semibold">{t(s.data.demo)}</strong>
        {' — '}
        {t(s.data.demoExplain)}
      </p>
    </div>
  );
}
