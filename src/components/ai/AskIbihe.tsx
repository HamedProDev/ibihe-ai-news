'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2 } from 'lucide-react';
import { useAsk } from '@/hooks/useAsk';
import { AIBadge } from '@/components/ui/Badges';
import { ErrorState } from '@/components/ui/States';
import { useLocale } from '@/components/i18n/LanguageProvider';

function renderLite(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•')) {
      return (
        <li key={i} className="ml-4 list-disc">
          {trimmed.slice(1).trim()}
        </li>
      );
    }
    if (trimmed === '') return <span key={i} className="block h-2" />;
    return <p key={i}>{trimmed}</p>;
  });
}

export function AskIbihe({ compact = false }: { compact?: boolean }) {
  const { s, locale } = useLocale();
  const { messages, loading, error, ask, clear } = useAsk();
  const [value, setValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const examples = locale === 'rw' ? s.ask.examples.rw : s.ask.examples.en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, loading]);

  return (
    <section
      aria-labelledby="ask-h"
      className={`bg-[#0d1a11] border border-[#00c853]/20 rounded-2xl ${compact ? 'p-4' : 'p-4 sm:p-5'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-[#00c853]/20 rounded-lg flex items-center justify-center">
          <Bot size={14} className="text-[#00c853]" aria-hidden="true" />
        </div>
        <h2 id="ask-h" className="text-white text-[15px] font-bold">
          {locale === 'rw' ? s.nav.ask.rw : s.nav.ask.en}
        </h2>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="ml-auto text-white/40 hover:text-white p-1.5"
            aria-label={locale === 'rw' ? 'Siba' : 'Clear'}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {messages.length === 0 && !loading && (
        <div className="my-3 space-y-1.5">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => ask(ex)}
              className="block w-full text-left text-[13px] text-white/65 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className={`space-y-3 my-3 ${compact ? 'max-h-72' : 'max-h-[420px]'} overflow-y-auto pr-1`} aria-live="polite">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <p key={i} className="ml-auto max-w-[85%] bg-[#00c853]/15 border border-[#00c853]/25 text-white text-sm rounded-xl rounded-br-sm px-3 py-2">
                {m.text}
              </p>
            ) : (
              <div key={i} className="max-w-[95%] bg-white/5 border border-white/10 text-white/85 text-sm rounded-xl rounded-bl-sm px-3 py-2.5 space-y-1.5">
                <div className="space-y-1 leading-relaxed">{renderLite(m.text)}</div>
                {m.answer && m.answer.citations.length > 0 && (
                  <div className="pt-1.5 border-t border-white/10">
                    <p className="text-white/40 text-[11px] mb-1">
                      {locale === 'rw' ? s.ask.sources.rw : s.ask.sources.en}:
                    </p>
                    <ul className="space-y-0.5">
                      {m.answer.citations.map((c) => (
                        <li key={c.refId} className="text-[12px] text-[#00c853]">
                          [{c.kind}] {locale === 'rw' ? c.labelKiny : c.labelEn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.answer && (
                  <div className="pt-1">
                    <AIBadge ai={m.answer.ai} size="xs" />
                  </div>
                )}
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {loading && (
        <p className="text-white/45 text-[13px] my-2 animate-pulse" role="status">
          {locale === 'rw' ? s.ask.thinking.rw : s.ask.thinking.en}
        </p>
      )}
      {error && (
        <div className="my-2">
          <ErrorState error={error} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            ask(value);
            setValue('');
          }
        }}
        className="flex gap-2 mt-2"
      >
        <label htmlFor="ask-input" className="sr-only">
          {locale === 'rw' ? s.ask.placeholder.rw : s.ask.placeholder.en}
        </label>
        <input
          id="ask-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={locale === 'rw' ? s.ask.placeholder.rw : s.ask.placeholder.en}
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#00c853]/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="shrink-0 bg-[#00c853] hover:bg-[#00e65f] disabled:opacity-40 text-black font-semibold text-sm rounded-xl px-3.5 py-2.5 inline-flex items-center gap-1.5 transition-colors"
        >
          <Send size={14} aria-hidden="true" />
          <span className="hidden sm:inline">{locale === 'rw' ? s.ask.send.rw : s.ask.send.en}</span>
        </button>
      </form>
    </section>
  );
}
