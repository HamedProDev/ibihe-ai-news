'use client';

import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ApiError } from '@/lib/client/api';

export function LoadingSkeleton({ lines = 4, label }: { lines?: number; label?: string }) {
  const { t, s } = useLocale();
  return (
    <div role="status" aria-live="polite" aria-label={label ?? (t(s.states.loading))} className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-24 bg-ink/5 rounded-xl animate-pulse" aria-hidden="true" />
      ))}
      <span className="sr-only">{t(s.states.loading)}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError | Error | null; onRetry?: () => void }) {
  const { t, s, locale } = useLocale();
  const msg =
    error instanceof ApiError
      ? locale === 'rw' ? error.messageKiny : error.message
      : t(s.states.error);
  return (
    <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
      <AlertTriangle size={20} className="text-danger mx-auto mb-2" aria-hidden="true" />
      <p className="text-ink/80 text-sm mb-3">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink/10 hover:bg-ink/15 text-ink text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {t(s.states.retry)}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { t, s } = useLocale();
  return (
    <div className="bg-ink/[0.03] border border-ink/10 rounded-xl p-8 text-center">
      <Inbox size={22} className="text-ink/30 mx-auto mb-2" aria-hidden="true" />
      <p className="text-ink/50 text-sm">{message ?? (t(s.states.empty))}</p>
    </div>
  );
}
