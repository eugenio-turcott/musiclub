'use client';
import { useState } from 'react';
import Image from 'next/image';
import sources from '../utils/coverImageSource.cjs';
import { PLACEHOLDER_COVER } from '../utils/coverPlaceholder';

export function CoverImage({ src, ...props }) {
  // A different release starts a fresh load, even when React reuses the card.
  return <CoverImageSource key={src || ''} src={src} {...props} />;
}

function CoverImageSource({ src, alt = '', loading = 'lazy', sizes = '(max-width: 640px) 45vw, 240px', onError, ...props }) {
  const [attempt, setAttempt] = useState(0);
  const source = sources.coverImageSource(src, attempt);
  const handleError = source.fallback ? undefined : event => {
    // Changing src alone leaves responsive candidates active in the browser.
    event.currentTarget.removeAttribute('srcset');
    event.currentTarget.removeAttribute('sizes');
    setAttempt(attempt + 1);
    if (attempt === 1) onError?.(event);
  };
  const common = { width: 320, height: 320, ...props, alt, loading, decoding: 'async', onError: handleError };
  if (source.fallback) return <img {...common} src={PLACEHOLDER_COVER} />;
  if (source.optimized) return <Image {...common} src={source.src} sizes={sizes} />;
  return <img {...common} src={source.src} srcSet={source.srcSet} sizes={source.srcSet ? sizes : undefined} />;
}
