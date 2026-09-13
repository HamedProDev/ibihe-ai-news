'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { WhyItMatters } from '@/types';
import { audienceLabel } from '@/lib/news/why-matters';
import { AIBadge } from '@/components/ui/Badges';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function WhyMatters({ items }: { items: WhyItMatters[] }) {
  const { locale } = useLocale();
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;
  const current = items[Math.min(active, items.length - 1)];
  if (!current) return null;

  return (
    <section aria-labelledby="why-h" className="bg-brand/10 border border-brand/20 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id="why-h" className="flex items-center gap-2 text-ink text-[15px] font-bold">
          <HelpCircle size={16} className="text-brand-ink" aria-hidden="true" />
          {locale === 'rw' ? 'Kuki ari ingenzi?' : 'Why does it matter?'}
        </h2>
        <AIBadge
          size="xs"
          ai={{
            inputIds: [],
            model: 'ibihe-why-matters-0.1',
            promptVersion: 'why-rules-v1',
            generatedAt: new Date().toISOString(),
            reviewStatus: 'unreviewed',
            isRuleBased: true,
          }}
        />
      </div>
      <div role="tablist" aria-label={locale === 'rw' ? 'Kuki ari ingenzi?' : 'Why does it matter?'} className="flex gap-1.5 flex-wrap mb-3">
        {items.map((w, i) => (
          <button
            key={w.audience}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              i === active
                ? 'bg-brand text-on-brand border-brand'
                : 'text-ink/60 border-ink/15 hover:border-ink/30 hover:text-ink'
            }`}
          >
            {audienceLabel(w.audience, locale)}
          </button>
        ))}
      </div>
      <p role="tabpanel" className="text-ink/75 text-sm leading-relaxed">
        {locale === 'rw' ? current.textKiny : current.textEn}
      </p>
    </section>
  );
}
