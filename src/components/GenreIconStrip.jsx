'use client';
import { GenreArtwork } from './GenreArtwork';
import catalog from '../utils/genreCatalog.cjs';

export function GenreIconStrip({ genres, className = '', size = 22 }) {
  const names = catalog.normalizeGenres(genres || []);
  if (!names.length) return null;
  const visible = names.slice(0, 3);
  return <span data-release-genres className={`inline-flex max-w-full items-center gap-1 rounded-full border border-white/20 bg-black/70 p-1 text-white shadow-sm backdrop-blur-md ${className}`} role="img" aria-label={`Géneros: ${names.join(', ')}`} title={names.join(', ')}>
    {visible.map(name => <span key={name} title={name} className="inline-flex shrink-0"><GenreArtwork genre={name} size={size}/></span>)}
    {names.length > visible.length && <span aria-hidden="true" className="pr-1 text-[9px] font-bold">+{names.length-visible.length}</span>}
  </span>;
}
