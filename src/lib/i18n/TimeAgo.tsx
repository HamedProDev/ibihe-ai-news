'use client';

import { useSyncExternalStore } from 'react';
import type { Locale } from './dictionaries';
import { timeAgo } from './timeago';

/** No-op — the snapshot function is pure, so no external subscription needed. */
const noop = () => () => {};

/**
 * Hydration-safe wrapper around `timeAgo`. Uses `useSyncExternalStore` to
 * render an empty string during SSR and the real relative time on the client,
 * eliminating the server/client locale + timing mismatch.
 */
export function TimeAgo({
  iso,
  locale,
  className,
}: {
  iso: string;
  locale: Locale;
  className?: string;
}) {
  const text = useSyncExternalStore(
    noop,
    () => timeAgo(iso, locale),
    () => '',
  );
  return <span className={className}>{text}</span>;
}
