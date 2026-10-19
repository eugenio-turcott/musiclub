'use client';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoverImage } from '../CoverImage';
import { GenreArtwork } from '../GenreArtwork';
import { GenrePicker } from '../GenrePicker';
import { getReleaseUrl } from '../../utils/ratingUtils';
import genres from '../../utils/genreCatalog.cjs';

export function CatalogGenresView({ albums = [] }) {
  const [selected, setSelected] = useState('all');
  const [page, setPage] = useState(1);
  const counts = useMemo(() => genres.genreCounts(albums), [albums]);
  const available = useMemo(() => genres.GENRES.filter(genre => selected === 'all' ? counts.has(genre.id) : genre.id === selected).sort((a,b) => (counts.get(b.id)||0)-(counts.get(a.id)||0) || a.name.localeCompare(b.name, 'es')), [counts, selected]);
  const pages = Math.max(1, Math.ceil(available.length/24));
  return <section className="my-6 space-y-6">
    <h2 className="text-3xl font-black text-white">Explora la música por géneros</h2>
    <p className="text-slate-300">Géneros y subgéneros vinculados a los lanzamientos reales del club. Las variantes de un mismo nombre se muestran juntas.</p>
    <GenrePicker albums={albums} value={selected} onChange={value => { setSelected(value); setPage(1); }} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{available.slice((page-1)*24,page*24).map(genre => {
      const releases = genres.filterByGenre(albums, genre.id);
      const capsule = genres.genreCapsule(genre.id);
      return <article key={genre.id} className="space-y-4 rounded-2xl border border-white/15 bg-slate-950/60 p-5">
        <div className="flex items-center gap-3"><GenreArtwork genre={genre.id} size={64} className="h-16 w-16 shrink-0" /><h3 className="text-xl font-bold text-white" translate="no">{genre.name}</h3></div>
        <p className="text-sm text-slate-300">{releases.length} lanzamientos</p>
        <div className="grid grid-cols-4 gap-2">{releases.slice(0,4).map(album => <Link key={album.id} to={getReleaseUrl(album)} title={album.album_name || album.album}><CoverImage src={album.image_url || album.imagen} alt={album.album_name || album.album} width={96} height={96} sizes="80px" className="aspect-square w-full rounded-lg object-cover" /></Link>)}</div>
        {!releases.length && <p className="text-sm text-amber-200">Este género aún no tiene lanzamientos en el club.</p>}
        <Link to={'/gashapon?genero='+encodeURIComponent(genre.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-bold text-white"><span aria-hidden="true" className="h-5 w-5 rounded-full border border-white/60" style={{background:capsule.topBackground}} />Descubrir en Gashapon</Link>
      </article>;
    })}</div>
    {pages > 1 && <nav aria-label="Páginas de géneros" className="flex items-center justify-center gap-4"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="min-h-11 rounded-xl border border-white/25 px-4 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="min-h-11 rounded-xl border border-white/25 px-4 disabled:opacity-40">Siguiente</button></nav>}
  </section>;
}
