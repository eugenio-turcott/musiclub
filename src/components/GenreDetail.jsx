'use client';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { GenreArtwork } from './GenreArtwork';
import { CoverImage } from './CoverImage';
import { getReleaseUrl } from '../utils/ratingUtils';

export function GenreDetail({ genre, albums }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(albums.length / 24));
  return <div className="mx-auto w-full max-w-7xl space-y-6 px-3 pb-12 sm:px-6">
    <AppHeader showTitle={false} />
    <section className="rounded-3xl border border-white/10 bg-linear-to-br from-[#14142b] via-[#0d1020] to-[#080913] p-5 shadow-xl sm:p-8">
      <Link to="/catalogo?tab=genres" className="inline-flex min-h-11 items-center text-xs font-bold text-white/60 hover:text-white">← Explorar géneros</Link>
      <div className="mt-3 flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:gap-8 sm:text-left"><GenreArtwork genre={genre.id} size={208} animated className="h-40 w-40 shrink-0 sm:h-52 sm:w-52" /><div className="min-w-0"><h1 translate="no" className="wrap-anywhere text-3xl font-black text-white sm:text-4xl">{genre.name}</h1><p className="mt-2 text-sm text-white/60">{albums.length} {albums.length === 1 ? 'lanzamiento del club' : 'lanzamientos del club'}</p></div></div>
      <p className="mt-5 text-sm leading-relaxed text-white/60">Explora los álbumes, EPs y sencillos clasificados como <span translate="no">{genre.name}</span> en Musiclub y descubre las reseñas de la comunidad.</p>
      {albums.length > 0 && <Link to={'/gashapon?genero='+encodeURIComponent(genre.id)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-linear-to-r from-[#f5576c] to-[#f093fb] px-4 py-2 text-sm font-bold text-white"><GenreArtwork genre={genre.id} size={24} className="h-6 w-6" />Descubrir en Gashapon</Link>}
    </section>
    {!albums.length ? <p className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/60">Este género aún no tiene lanzamientos en el club.</p> : <section aria-label={`Lanzamientos de ${genre.name}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {albums.slice((page-1)*24,page*24).map(album => <article key={album.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#121424] shadow-lg">
        <Link to={getReleaseUrl(album)}><CoverImage src={album.image_url || album.imagen} alt={album.album_name || album.album} width={320} height={320} sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 240px" className="aspect-square w-full object-cover" /></Link>
        <div className="space-y-2 p-3 sm:p-4"><h2 translate="no" className="line-clamp-2 text-sm font-extrabold text-white"><Link to={getReleaseUrl(album)}>{album.album_name || album.album}</Link></h2><p translate="no" className="truncate text-xs text-white/50">{album.artist_name || album.artista}</p><p className="text-xs text-white/60">{album.review_count > 0 ? `★ ${Number(album.base_rating ?? album.avg_rating ?? album.final_rating ?? 0).toFixed(1)}/10 · ${album.review_count} ${album.review_count === 1 ? 'reseña' : 'reseñas'}` : 'Aún sin reseñas'}</p></div>
      </article>)}
    </section>}
    {pages > 1 && <nav aria-label="Páginas de lanzamientos" className="flex items-center justify-center gap-4 text-sm"><button disabled={page===1} onClick={()=>setPage(value=>value-1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(value=>value+1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Siguiente</button></nav>}
    <Footer />
  </div>;
}
