'use client';
import { Link } from 'react-router-dom';
import { CoverImage } from './CoverImage';
import { ArtistLinks } from './common/ArtistLinks';
import { getReleaseUrl } from '../utils/ratingUtils';

export function GenreReleaseCard({ album }) {
  const url = getReleaseUrl(album);
  const title = album.album_name || album.album;
  const count = Number(album.review_count) || 0;
  const reviewed = count > 0;
  const rawScore = album.final_rating ?? album.avg_rating ?? album.base_rating;
  const score = rawScore != null && rawScore !== '' && Number.isFinite(Number(rawScore)) ? Number(rawScore) : null;
  const favorite = reviewed && album.best_track?.name ? album.best_track : null;
  const trackScore = favorite?.avg_rating != null && favorite.avg_rating !== '' && Number.isFinite(Number(favorite.avg_rating)) ? Number(favorite.avg_rating) : null;
  return <article data-genre-release={album.id} data-has-reviews={reviewed} className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-[#11131e]/95 shadow-lg transition-colors ${reviewed ? 'border-amber-500/30 hover:border-amber-400/70' : 'border-white/10 hover:border-cyan-300/35'}`}>
    <div className="relative aspect-square overflow-hidden bg-black/40">
      <Link to={url} aria-label={`Ver ${title}`}><CoverImage src={album.image_url || album.imagen} alt={title} width={320} height={320} sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 280px" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" /></Link>
      {reviewed && score !== null && <span data-release-score className="pointer-events-none absolute right-2 top-2 rounded-lg border border-amber-500/40 bg-black/85 px-2 py-0.5 text-xs font-black text-amber-300 shadow-md backdrop-blur-md" aria-label={`Calificación: ${score.toFixed(2)} de 10`}>{score.toFixed(2)} <span aria-hidden="true">★</span></span>}
      {(reviewed || album.release_year) && <div className="pointer-events-none absolute inset-x-0 bottom-0 flex min-h-12 items-end justify-between gap-2 bg-linear-to-t from-black/90 via-black/35 to-transparent p-2 text-[10px] text-slate-200">
        {reviewed && <span data-release-review-count className="rounded border border-white/10 bg-black/60 px-1.5 py-0.5">📝 {count} {count === 1 ? 'reseña' : 'reseñas'}</span>}
        {album.release_year && <span className="ml-auto font-mono font-bold">{album.release_year}</span>}
      </div>}
    </div>
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
      <div className="min-w-0 space-y-1.5">
        <h2 translate="no" className="notranslate line-clamp-2 text-xs font-extrabold leading-snug text-white sm:text-sm"><Link to={url} title={title} className="transition-colors hover:text-pink-200">{title}</Link></h2>
        <ArtistLinks artistName={album.artist_name || album.artista} className="line-clamp-1 text-[11px] text-slate-400 sm:text-xs" linkClassName="transition-colors hover:text-cyan-300" />
      </div>
      {favorite && <div data-release-favorite className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5 text-[10px] text-slate-300">
        <span className="min-w-0 truncate" title={favorite.name}>👑 <span translate="no" className="notranslate">{favorite.name}</span></span>
        {trackScore !== null && <span className="shrink-0 font-bold text-amber-300">{trackScore.toFixed(1).replace(/\.0$/, '')} ★</span>}
      </div>}
      <div className="mt-auto border-t border-white/5 pt-2">
        <Link to={url} className={`flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-center text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${reviewed ? 'border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-black' : 'border-white/10 bg-white/5 text-white/75 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200'}`}><span aria-hidden="true">{reviewed ? '🎧' : '↗'}</span>{reviewed ? 'Ver Reseñas' : 'Ver lanzamiento'}</Link>
      </div>
    </div>
  </article>;
}
