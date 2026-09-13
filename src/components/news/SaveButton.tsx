'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { isSaved, toggleSaved, type SavedStory } from '@/lib/news/saved';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function SaveButton({ story, size = 16 }: { story: SavedStory; size?: number }) {
  const { t, s } = useLocale();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved state once on mount
    setSaved(isSaved(story.id));
  }, [story.id]);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t(s.article.saved) : t(s.article.save)}
      title={saved ? t(s.article.saved) : t(s.article.save)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleSaved(story));
      }}
      className={`shrink-0 rounded-lg p-1.5 transition-colors ${
        saved ? 'text-brand-ink bg-brand/10' : 'text-ink/40 hover:text-ink hover:bg-ink/10'
      }`}
    >
      {saved ? <BookmarkCheck size={size} aria-hidden /> : <Bookmark size={size} aria-hidden />}
    </button>
  );
}
