'use client';
import { Link } from 'react-router-dom';
import { GenreArtwork } from './GenreArtwork';
import catalog from '../utils/genreCatalog.cjs';
import routes from '../utils/genreRoutes.cjs';

export function ReleaseGenresPanel({ genres }) {
  const names = catalog.normalizeGenres(genres, 64);
  return <aside className="release-genres-panel min-w-0 space-y-4" aria-labelledby="release-genres-heading">
    <div><h2 id="release-genres-heading" className="text-xl font-black text-white sm:text-2xl">Géneros del release</h2><p className="mt-1 text-xs text-slate-400">Explora los sonidos de este lanzamiento.</p></div>
    <div className="rounded-3xl border border-white/5 bg-[#121422]/90 p-4 sm:p-5">
      {names.length ? <div className={`release-genres-scroll ${names.length > 3 ? 'release-genres-many' : ''}`} tabIndex={names.length > 3 ? 0 : undefined} aria-label="Vinilos de los géneros del release">
        {names.map(name => <Link key={name} to={routes.genrePath(name)} className="release-genre-vinyl group rounded-2xl p-2 text-center outline-offset-2 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-pink-300">
          <GenreArtwork genre={name} size={180} className="mx-auto h-auto w-full max-w-44 transition-transform motion-safe:group-hover:scale-105" />
          <span className="mt-2 block text-xs font-bold text-slate-200">{name}</span>
        </Link>)}
      </div> : <p className="py-6 text-center text-sm text-slate-400">Los géneros aún no están disponibles.</p>}
      {names.length > 3 && <p className="mt-3 text-center text-[11px] text-slate-400">Desliza para explorar todos los géneros</p>}
    </div>
  </aside>;
}
