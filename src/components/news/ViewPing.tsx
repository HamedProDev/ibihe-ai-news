'use client';

import { useEffect, useRef } from 'react';

/** Fire-and-forget view counter (once per mount). */
export function ViewPing({ id }: { id: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/articles/${encodeURIComponent(id)}/view`, { method: 'POST' }).catch(() => undefined);
  }, [id]);
  return null;
}
