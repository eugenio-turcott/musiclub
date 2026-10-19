'use client';
import visuals from '../utils/genreVisuals.cjs';

export function GenreArtwork({ genre, edition, className = '', size = 96 }) {
  const visual = visuals.genreRevealArtwork(genre, edition);
  return <svg viewBox="0 0 320 320" width={size} height={size} aria-hidden="true" focusable="false" data-vinyl-edition={visual.id} className={className}>
    <image href={visual.disc} width="320" height="320" />
    <image href={visual.center} x="82" y="76" width="156" height="156" />
  </svg>;
}
