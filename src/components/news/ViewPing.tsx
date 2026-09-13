'use client';

import { useEffect, useRef } from 'react';

/**
 * Fire-and-forget counters, once per mount:
 *  • the article's own view number (public "views")
 *  • an analytics event the console dashboard reads (/api/admin/analytics)
 */
export function ViewPing({ id, kind = 'article_view' }: { id: string; kind?: 'article_view' | 'article_preview' }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/articles/${encodeURIComponent(id)}/view`, { method: 'POST' }).catch(() => undefined);
    if (kind === 'article_view') {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'article_view', refId: id }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [id, kind]);
  return null;
}
