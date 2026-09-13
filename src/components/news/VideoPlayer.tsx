'use client';

import { useRef, useState } from 'react';
import { Captions, ExternalLink, Play } from 'lucide-react';
import type { VideoAsset } from '@/types/news';
import { durationLabel, isIframeEmbeddable, isSafeFileUrl, PROVIDER_LABELS } from '@/lib/media/video';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { pickCaption } from '@/lib/news/localize';

/**
 * One embedded clip. Iframed providers go through the whitelist check again at
 * render time (defence in depth); direct files render in <video>; X/Facebook
 * posts we cannot frame degrade to a link card.
 */
export function VideoPlayer({ video, eager = false }: { video: VideoAsset; eager?: boolean }) {
  const { locale } = useLocale();
  const [playing, setPlaying] = useState(eager);
  const [showTranscript, setShowTranscript] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const caption = pickCaption(video, locale);
  const title = locale === 'rw' ? (video.titleKiny || video.title || '') : (video.title || video.titleKiny || '');
  const framed = isIframeEmbeddable(video);
  const fileOk = (video.provider === 'file' || video.provider === 'hls') && isSafeFileUrl(video.embedUrl);
  const src = video.startSec ? `${video.embedUrl}${video.embedUrl.includes('?') ? '&' : '?'}start=${video.startSec}` : video.embedUrl;

  return (
    <figure className="my-6">
      <div className="x-video">
        {framed ? (
          playing ? (
            <iframe
              src={src}
              title={title || `${PROVIDER_LABELS[video.provider]} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading={eager ? 'eager' : 'lazy'}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setPlaying(true);
                window.requestIdleCallback?.(() => undefined);
                fetch('/api/metrics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'video_play', refId: video.id, meta: { provider: video.provider } }),
                  keepalive: true,
                }).catch(() => undefined);
              }}
              className="group flex h-full w-full items-center justify-center bg-black"
              aria-label={`${durationLabel(video.durationSec) ? `${durationLabel(video.durationSec)} — ` : ''}${title || 'Play video'}`}
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- provider thumbnail
                <img src={video.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" />
              ) : null}
              <span className="relative flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition-transform group-hover:scale-105">
                <Play size={16} aria-hidden fill="currentColor" />
                <span className="x-on-image/90 text-on-brand">{title || '▶'}</span>
              </span>
            </button>
          )
        ) : fileOk ? (
          <video
            ref={hostRef as never}
            src={video.embedUrl}
            controls
            preload={eager ? 'metadata' : 'none'}
            poster={video.thumbnailUrl}
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 p-4 text-center">
            <p className="text-sm text-ink/70">{title || 'Video'}</p>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="x-btn x-btn--primary x-btn--sm"
            >
              <ExternalLink size={13} aria-hidden />
              {PROVIDER_LABELS[video.provider]}
            </a>
          </div>
        )}
      </div>

      {(caption || video.attribution || video.durationSec || video.transcript) && (
        <figcaption className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/50">
          {caption && <span className="text-ink/70">{caption}</span>}
          {video.attribution && <span>· {video.attribution}</span>}
          {video.durationSec ? <span>· {durationLabel(video.durationSec)}</span> : null}
          <span className="x-chip !py-0 !text-[10px]">{PROVIDER_LABELS[video.provider]}</span>
          {video.transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript}
              className="ms-auto inline-flex items-center gap-1 text-brand-ink hover:underline"
            >
              <Captions size={13} aria-hidden />
              {locale === 'rw' ? 'Ibyavuzwe' : 'Transcript'}
            </button>
          )}
        </figcaption>
      )}

      {showTranscript && video.transcript && (
        <div className="x-inset mt-2 p-3 text-[13px] leading-relaxed text-ink/75 whitespace-pre-line">{video.transcript}</div>
      )}
    </figure>
  );
}
