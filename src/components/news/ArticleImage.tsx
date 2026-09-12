'use client';

import { useState } from 'react';

/**
 * Feed/editorial image with graceful fallback. External hotlinked images
 * often 403 or die — onError swaps to the brand gradient instead of a
 * broken-image icon. `no-referrer` improves hotlink success rates.
 */
export function ArticleImage({
  src,
  alt,
  className = '',
  imgClassName = '',
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${className} bg-gradient-to-br from-[#00c853]/25 via-[#0d3a1e] to-[#001a0a]`}
      />
    );
  }
  return (
    <div className={`${className} overflow-hidden bg-[#0d1a11]`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- external feed images stay unoptimized by design */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}
