'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { TimeAgo } from '@/lib/i18n/TimeAgo';
import type { Comment } from '@/types/comments';

interface ListPayload {
  items?: Comment[];
  disabled?: boolean;
}

/** Reader discussion, moderated by the newsroom (status=pending until approved). */
export function Comments({ articleId, enabled = true }: { articleId: string; enabled?: boolean }) {
  const { t, s, locale } = useLocale();
  const [items, setItems] = useState<Comment[]>([]);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?article=${encodeURIComponent(articleId)}`);
      const json = (await res.json()) as { ok: boolean; data?: ListPayload };
      if (json.ok && json.data) {
        setItems(Array.isArray(json.data.items) ? json.data.items : []);
        setClosed(Boolean(json.data.disabled));
      }
    } catch {
      /* comments are optional — silence is fine */
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    void load();
  }, [load]);

  if (!enabled || closed) {
    return (
      <section aria-label={t(s.article.comments)} className="x-card x-card-pad mt-8 text-[13px] text-ink/50">
        {t(s.article.commentsClosed)}
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, name, email, body, language: locale }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { message?: { rw: string; en: string } };
        error?: { messageKiny?: string; messageEn?: string };
      };
      if (json.ok && json.data?.message) {
        setNote(locale === 'rw' ? json.data.message.rw : json.data.message.en);
        setBody('');
        await load();
      } else {
        setNote(locale === 'rw' ? (json.error?.messageKiny ?? '—') : (json.error?.messageEn ?? 'Something went wrong.'));
      }
    } catch {
      setNote('Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={t(s.article.comments)} className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink">
        <MessageSquare size={16} className="text-brand-ink" aria-hidden />
        {t(s.article.comments)}
        {items.length > 0 && <span className="x-chip">{items.length}</span>}
      </h2>

      {loading ? (
        <div className="space-y-2">
          <div className="x-skeleton h-16" />
          <div className="x-skeleton h-16" />
        </div>
      ) : items.length === 0 ? (
        <p className="x-card x-card-pad text-[13px] text-ink/55">{t(s.article.noComments)}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="x-card x-card-pad !p-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink/45">
                <span className="font-semibold text-ink/80">{c.authorName || '匿名'}</span>
                <span aria-hidden>·</span>
                <span><TimeAgo iso={c.createdAt} locale={locale} /></span>
                {c.language && c.language !== locale && <span className="x-chip !py-0 !text-[10px]">{c.language.toUpperCase()}</span>}
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink/85">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="x-card x-card-pad mt-3">
        <label className="block">
          <span className="x-label">{t(s.article.leaveComment)}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1200}
            required
            className="x-input"
            placeholder={t(s.sidebar.tipPlaceholder)}
          />
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="x-label">{t(s.article.yourName)}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="x-input" />
          </label>
          <label className="block">
            <span className="x-label">{t(s.article.yourEmail)}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className="x-input" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !body.trim()} className="x-btn x-btn--primary">
            <Send size={14} aria-hidden />
            {busy ? '…' : t(s.article.postComment)}
          </button>
          {note && (
            <p role="status" className="text-[13px] text-brand-ink">
              {note}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
