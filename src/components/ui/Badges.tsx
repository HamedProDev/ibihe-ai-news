'use client';

import { BadgeCheck, Bot, FlaskConical, Radio } from 'lucide-react';
import type { AIGeneration, ContentStatus, DataMode } from '@/types';
import { useLocale } from '@/components/i18n/LanguageProvider';

const STATUS_STYLES: Record<ContentStatus, string> = {
  verified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  developing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'multi-source': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  analysis: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  forecast: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  opinion: 'bg-white/10 text-white/60 border-white/20',
};

export function ContentStatusBadge({ status, size = 'sm' }: { status: ContentStatus; size?: 'xs' | 'sm' }) {
  const { s, locale } = useLocale();
  const label = locale === 'rw' ? s.status[status].rw : s.status[status].en;
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
  const { s, locale } = useLocale();
  const label = ai.isRuleBased
    ? locale === 'rw' ? s.ai.ruleBased.rw : s.ai.ruleBased.en
    : locale === 'rw' ? s.ai.generated.rw : s.ai.generated.en;
  const title = `${ai.model} · ${ai.promptVersion} · ${ai.generatedAt.slice(0, 10)} · ${
    ai.reviewStatus === 'reviewed' ? (locale === 'rw' ? s.ai.reviewed.rw : s.ai.reviewed.en) : locale === 'rw' ? s.ai.unreviewed.rw : s.ai.unreviewed.en
  }`;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border bg-[#00c853]/10 text-[#00c853] border-[#00c853]/25 font-medium ${
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
    ubuhinzi: 'bg-green-500/15 text-green-300 border-green-500/30',
    politiki: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    ubukungu: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    ikoranabuhanga: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    ubuzima: 'bg-red-500/15 text-red-300 border-red-500/30',
    imikino: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    amahanga: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${colors[category] ?? 'bg-white/10 text-white/60 border-white/20'}`}>
      {label}
    </span>
  );
}

/** Honest banner shown whenever demo/illustrative data is displayed. */
export function DemoBanner({ mode }: { mode: DataMode }) {
  const { s, locale } = useLocale();
  if (mode === 'live') return null;
  return (
    <div role="note" className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5 mb-4">
      <FlaskConical size={15} className="text-amber-300 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-amber-200/90 text-xs leading-relaxed">
        <strong className="font-semibold">{locale === 'rw' ? s.data.demo.rw : s.data.demo.en}</strong>
        {' — '}
        {locale === 'rw' ? s.data.demoExplain.rw : s.data.demoExplain.en}
      </p>
    </div>
  );
}
