'use client';

import type { Block, Inline } from '@/lib/media/markdown';
import type { VideoAsset } from '@/types/news';
import { VideoPlayer } from './VideoPlayer';
import { ArticleImage } from './ArticleImage';

function InlineSpans({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        const cls = [n.bold && 'font-semibold', n.italic && 'italic', n.code && 'rounded bg-fill-2 px-1 py-0.5 font-mono text-[0.9em]']
          .filter(Boolean)
          .join(' ');
        if (n.link) {
          return (
            <a key={i} href={n.link} target={n.link.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer nofollow">
              {n.text}
            </a>
          );
        }
        return cls ? <span key={i} className={cls}>{n.text}</span> : <span key={i}>{n.text}</span>;
      })}
    </>
  );
}

/**
 * Renders the parsed story body. `{{video:id}}` tokens become real players,
 * images become figures with the shared fallback, everything else is plain
 * React nodes — the body can never inject HTML.
 */
export function Prose({
  blocks,
  videos = [],
  eagerFirstVideo = false,
}: {
  blocks: Block[];
  videos?: VideoAsset[];
  eagerFirstVideo?: boolean;
}) {
  if (blocks.length === 0) return null;
  const byId = new Map(videos.map((v) => [v.id, v]));
  // Only the first referenced clip is loaded eagerly (LCP friendly).
  const firstVideoId = blocks.find((b) => b.type === 'video')?.id ?? null;

  return (
    <div className="x-prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return <h2 key={i}>{b.text}</h2>;
          case 'h3':
            return <h3 key={i}>{b.text}</h3>;
          case 'p':
            return (
              <p key={i}>
                <InlineSpans nodes={b.inline} />
              </p>
            );
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <InlineSpans nodes={it} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <InlineSpans nodes={it} />
                  </li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote key={i}>
                <InlineSpans nodes={b.inline} />
                {b.cite && <footer className="mt-1 text-[0.85em] not-italic text-ink/50">— {b.cite}</footer>}
              </blockquote>
            );
          case 'image':
            return (
              <figure key={i}>
                <ArticleImage src={b.url} alt={b.alt} className="aspect-video w-full rounded-xl" />
                {b.alt && <figcaption>{b.alt}</figcaption>}
              </figure>
            );
          case 'video': {
            const v = byId.get(b.id);
            if (!v) return null;
            return <VideoPlayer key={i} video={v} eager={eagerFirstVideo && b.id === firstVideoId} />;
          }
          case 'hr':
            return <hr key={i} className="x-hr" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
