'use client';
import visuals from '../utils/genreVisuals.cjs';

export function GenreArtwork({ genre, className = '', size = 96 }) {
  const visual = visuals.genreArtwork(genre);
  return <img src={visual.src} width={size} height={size} alt="" aria-hidden="true" loading="lazy" draggable="false" className={className} />;
}
