'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { ApiError } from '@/lib/client/api';

/* ------------------------------- layout ------------------------------- */

export function Panel({
  title,
  actions,
  children,
  subtitle,
  className = '',
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`x-card overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            {title && <h2 className="truncate text-[13px] font-bold uppercase tracking-wide text-ink/70">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-ink/45">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'brand' | 'warn' | 'danger' | 'ok';
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const toneCls: Record<string, string> = {
    default: 'text-ink',
    brand: 'text-brand-ink',
    warn: 'text-warn',
    danger: 'text-danger',
    ok: 'text-ok',
  };
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={`x-card x-card-pad flex flex-col items-start gap-1 text-start transition-colors ${
        onClick ? 'hover:border-line-3' : ''
      }`}
    >
      <span className="flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </span>
      <span className={`text-2xl font-extrabold leading-none sm:text-[28px] ${toneCls[tone] ?? 'text-ink'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {hint && <span className="text-[11px] text-ink/45">{hint}</span>}
    </Wrapper>
  );
}

/* -------------------------------- form -------------------------------- */

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="x-label">
        {label}
        {required && <span className="ms-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] leading-snug text-ink/45">{hint}</span>}
      {error && (
        <span className="mt-1 block text-[11px] font-medium text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-fill px-3 py-2.5 text-start transition-colors hover:border-line-2"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-fill-3'
        }`}
        aria-hidden
      >
        <span className={`absolute size-4 rounded-full bg-white shadow transition-all ${checked ? 'start-[1.15rem]' : 'start-0.5'}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-ink/45">{hint}</span>}
      </span>
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="x-scroll-x flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            value === o.id ? 'border-brand bg-brand text-on-brand' : 'border-line-2 text-ink/60 hover:border-line-3 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; badge?: string | number }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="x-scroll-x flex gap-0.5 border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className="x-tab"
          data-active={active === tab.id}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge !== 0 && <span className="x-chip !py-0 !text-[10px]">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ feedback ------------------------------ */

export function Toast({ message, tone = 'info', onDismiss }: { message: string; tone?: 'info' | 'error' | 'ok'; onDismiss?: () => void }) {
  if (!message) return null;
  const cls =
    tone === 'error'
      ? 'border-danger/35 bg-danger/10 text-danger'
      : tone === 'ok'
        ? 'border-ok/35 bg-ok/10 text-ok'
        : 'border-brand/30 bg-brand/10 text-brand-ink';
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] ${cls}`}>
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="OK" className="opacity-60 hover:opacity-100">
          <X size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Local toast state shared by every console page. */
export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'error' | 'ok' } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string, tone: 'info' | 'error' | 'ok' = 'info') => {
    setToast({ message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4200);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { toast, show, clear: () => setToast(null) };
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t, s, locale } = useLocale();
  const message =
    error instanceof ApiError ? (locale === 'rw' && error.messageKiny ? error.messageKiny : error.message) : t(s.states.error);
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
      <AlertTriangle size={15} aria-hidden />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="x-btn x-btn--ghost x-btn--sm">
          {t(s.states.retry)}
        </button>
      )}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t, s } = useLocale();
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink/50" role="status">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      {label ?? t(s.states.loading)}
    </div>
  );
}

export function Empty({ message }: { message?: string }) {
  const { t, s } = useLocale();
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox size={22} className="text-ink/25" aria-hidden />
      <p className="text-[13px] text-ink/50">{message ?? t(s.states.empty)}</p>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`x-card flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-2xl ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        }`}
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="x-btn x-btn--ghost x-btn--icon" aria-label="Close">
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Pager({
  offset,
  total,
  pageSize,
  onOffset,
}: {
  offset: number;
  total: number;
  pageSize: number;
  onOffset: (n: number) => void;
}) {
  const { t, s } = useLocale();
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-ink/50">
      <button
        type="button"
        onClick={() => onOffset(Math.max(0, offset - pageSize))}
        disabled={offset === 0}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-fill-2 disabled:opacity-30"
      >
        <ChevronLeft size={13} aria-hidden className="rtl:rotate-180" />
        {t(s.common.back)}
      </button>
      <span>
        {total === 0 ? 0 : offset + 1}–{Math.min(offset + pageSize, total)} / {total}
      </span>
      <button
        type="button"
        onClick={() => onOffset(offset + pageSize)}
        disabled={offset + pageSize >= total}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-fill-2 disabled:opacity-30"
      >
        {t(s.common.retry)}
        <ChevronRight size={13} aria-hidden className="rtl:rotate-180" />
      </button>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  busy,
  tone = 'danger',
  className = '',
}: {
  onConfirm: () => void;
  label: string;
  confirmLabel: string;
  busy?: boolean;
  tone?: 'danger' | 'ghost';
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={`x-btn ${armed ? 'x-btn--danger' : tone === 'danger' ? 'x-btn--ghost' : 'x-btn--ghost'} x-btn--sm ${className}`}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

/** Small colored dot + label, used for publish states. */
export function StateDot({ state }: { state?: string }) {
  const map: Record<string, string> = {
    draft: 'bg-ink/30',
    scheduled: 'bg-warn',
    published: 'bg-brand',
    archived: 'bg-ink/20',
  };
  return <span className={`inline-block size-2 rounded-full ${map[state ?? 'published'] ?? 'bg-brand'}`} aria-hidden />;
}

/** Tiny bar chart for the dashboard/analytics panels (no chart lib). */
export function MiniBars({
  data,
  label,
  tone = 'brand',
}: {
  data: Array<{ label: string; value: number }>;
  label?: string;
  tone?: 'brand' | 'warn' | 'info';
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const toneCls = tone === 'warn' ? 'bg-warn/70' : tone === 'info' ? 'bg-info/70' : 'bg-brand/70';
  return (
    <div role="img" aria-label={label} className="flex h-24 items-end gap-1">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t transition-all group-hover:opacity-100 ${toneCls} ${d.value === 0 ? 'opacity-25' : ''}`}
              style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="w-full truncate text-center text-[9px] leading-none text-ink/40">{d.label.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal proportion bar (category distribution). */
export function MeterRow({ label, value, total, color }: { label: string; value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <li className="flex items-center gap-2 text-[12px]">
      <span className="w-28 shrink-0 truncate text-ink/65">{label}</span>
      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-2">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--color-brand)' }} />
      </span>
      <span className="w-12 shrink-0 text-end tabular-nums text-ink/50">
        {value} · {pct}%
      </span>
    </li>
  );
}
