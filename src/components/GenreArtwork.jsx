'use client';
import { useOnScreen } from '../hooks/useOnScreen';
import visuals from '../utils/genreArtworkSources.cjs';
import styles from './GenreArtwork.module.css';

export function GenreArtwork({ genre, edition, animated = false, className = '', discClassName = '', size = 96 }) {
  const [motionRef, isVisible] = useOnScreen({enabled:animated});
  const visual = visuals.genreArtworkSources(genre, edition);
  return <svg ref={motionRef} data-motion-visible={isVisible} viewBox="0 0 320 320" width={size} height={size} aria-hidden="true" focusable="false" data-vinyl-edition={visual.id} className={className}>
    <image href={visual.disc} width="320" height="320" className={[animated ? styles.spinning : '', discClassName].filter(Boolean).join(' ') || undefined} />
    <image href={visual.center} x="82" y="82" width="156" height="156" />
  </svg>;
}
