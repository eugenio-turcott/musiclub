'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { CoverImage } from './CoverImage';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../services/supabaseClient';
import { publicCatalog, clearPublicCatalog } from '../services/publicCatalog';
import { getReleaseUrl } from '../utils/ratingUtils';
import { buildGenreRecommendations } from '../utils/genreRecommendations.mjs';
import genres from '../utils/genreCatalog.cjs';
const ReviewSystem = dynamic(() => import('./ReviewSystem').then(module => module.ReviewSystem), { loading: () => <p>Cargando formulario…</p> });

export function Recommendations({ isPage = false, user: propUser = null, initialAlbums = [] }) {
  const auth = useAuth();
  const user = propUser || auth.user;
  const identity = user?.email || '';
  const [albums, setAlbums] = useState(initialAlbums);
  const [catalogLoading, setCatalogLoading] = useState(!initialAlbums.length);
  const [catalogError, setCatalogError] = useState('');
  const [history, setHistory] = useState({ identity: '', reviews: [], loading: false, error: '' });
  const [revision, setRevision] = useState(0);
  const [category, setCategory] = useState('recommended');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    if (!initialAlbums.length || revision) setCatalogLoading(true);
    publicCatalog().then(data => { if (!cancelled) { setAlbums(data.albums || []); setCatalogError(''); } })
      .catch(() => { if (!cancelled) setCatalogError('No se pudo actualizar el catálogo. Inténtalo de nuevo.'); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [initialAlbums.length, revision]);
  useEffect(() => {
    let cancelled = false;
    if (!identity) { setHistory({ identity: '', reviews: [], loading: false, error: '' }); return; }
    setHistory({ identity, reviews: [], loading: true, error: '' });
    supabaseService.getUserReviews(identity, null, { throwOnError: true })
      .then(reviews => { if (!cancelled) setHistory({ identity, reviews, loading: false, error: '' }); })
      .catch(() => { if (!cancelled) setHistory({ identity, reviews: [], loading: false, error: 'No pudimos leer tu historial. Mientras tanto, te mostramos selecciones de la comunidad.' }); });
    return () => { cancelled = true; };
  }, [identity, revision]);
  const historyReady = !identity || (history.identity === identity && !history.loading);
  const currentReviews = history.identity === identity ? history.reviews : [];
  const data = useMemo(() => buildGenreRecommendations(albums, currentReviews, { authenticated: Boolean(identity && historyReady) }), [albums, currentReviews, identity, historyReady]);
  const busy = catalogLoading || auth.loading || !historyReady;
  const list = category === 'popular' ? data.mostReviewed : category === 'acclaimed' ? data.acclaimed : data.recommendations;
  const pageCount = Math.max(1, Math.ceil(list.length / 12));
  useEffect(() => { setPage(1); }, [category, identity, data.personalized, revision]);
  useEffect(() => {
    if (!selected || !dialogRef.current) return;
    const dialog = dialogRef.current, opener = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; opener?.focus?.(); };
  }, [selected]);
  const refresh = () => { clearPublicCatalog(); setRevision(value => value + 1); };
  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
    {isPage && <AppHeader showTitle={false} />}
    <section className="space-y-5 rounded-3xl border border-white/15 bg-linear-to-br from-[#21152e] to-[#0b1020] p-5 sm:p-8">
      <h1 className="text-3xl font-black text-white sm:text-5xl">Para Ti{user?.name && <>, <span translate="no" className="text-pink-300">{user.name}</span></>}</h1>
      <p className="max-w-3xl text-slate-300">{data.personalized
        ? 'Descubre lanzamientos a partir de los géneros que has escuchado y de las notas que les has dado. Damos más peso a los géneros que disfrutas de forma constante.'
        : 'Descubre música que destaca en Musiclub por sus reseñas y buenas valoraciones. Combinamos la crítica de la comunidad con la cantidad de opiniones.'}</p>
      {busy ? <p role="status" className="text-cyan-200">Preparando tus recomendaciones…</p> : data.personalized ? <div className="space-y-3" data-recommendation-mode="personalized">
        <h2 className="text-xl font-bold">Tus géneros escuchados</h2>
        <p className="text-sm text-slate-300">Análisis de {data.ratedCount} lanzamientos distintos calificados · {data.genreProfile.length} géneros. Un lanzamiento puede pertenecer a varios géneros.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.genreProfile.slice(0,9).map(genre => <div key={genre.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <h3 className="font-bold text-purple-200" translate="no">{genre.name}</h3>
          <p className="text-sm text-slate-300">{genre.count} {genre.count === 1 ? 'lanzamiento' : 'lanzamientos'} · tu promedio {genre.average.toFixed(1)}/10</p>
        </div>)}</div>
        {data.genreProfile.length > 9 && <details className="text-sm text-slate-300"><summary className="cursor-pointer py-2">Ver todos tus géneros</summary><ul className="grid gap-2 py-3 sm:grid-cols-2">{data.genreProfile.slice(9).map(genre => <li key={genre.id}><span translate="no">{genre.name}</span>: {genre.count} lanzamientos · {genre.average.toFixed(1)}/10</li>)}</ul></details>}
      </div> : <div className="space-y-3 rounded-2xl border border-cyan-300/25 bg-black/25 p-4" data-recommendation-mode="community">
        <h2 className="font-bold text-cyan-200">Selecciones de la comunidad</h2>
        <p className="text-sm text-slate-300">{identity
          ? history.error ? 'Estamos recuperando tu historial; estas selecciones se basan en la comunidad.' : `Has calificado ${data.ratedCount} lanzamientos distintos. ${data.ratedCount < data.minimum ? `Al llegar a ${data.minimum}, activaremos el análisis de tus géneros.` : 'Necesitamos géneros y valoraciones disponibles en tu historial para personalizar las sugerencias.'}`
          : 'Puedes explorar estas recomendaciones sin iniciar sesión. Con 10 lanzamientos distintos calificados, las orientaremos a tus géneros.'}</p>
        {identity && !history.error && data.ratedCount < data.minimum && <progress aria-label="Lanzamientos calificados para personalizar" value={data.ratedCount} max={data.minimum} className="h-2 w-full accent-pink-400" />}
        <Link to="/catalogo#explorador-catalogo" className="inline-flex min-h-11 items-center rounded-xl bg-pink-600 px-4 font-bold text-white">Explorar y calificar lanzamientos</Link>
      </div>}
    </section>
    {(catalogError || history.error) && <div role="alert" className="space-y-2 rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4 text-sm text-amber-100"><p>{catalogError || history.error}</p><button className="min-h-11 rounded-xl border border-amber-300/40 px-4" onClick={refresh}>Volver a intentar</button></div>}
    <section className="space-y-5" aria-labelledby="recommendation-heading">
      <h2 id="recommendation-heading" className="text-2xl font-black">{data.personalized ? 'Tu siguiente escucha' : 'Lo que destaca en el club'}</h2>
      <div role="group" aria-label="Ordenar recomendaciones" className="flex flex-wrap gap-2">{[
        ['recommended', data.personalized ? 'Por tus géneros' : 'Selección del club'], ['popular','Más reseñados'], ['acclaimed','Buena crítica'],
      ].map(([value,label]) => <button key={value} aria-pressed={category===value} onClick={()=>setCategory(value)} className={`min-h-11 rounded-xl border px-4 text-sm font-bold ${category===value ? 'border-pink-400 bg-pink-600 text-white' : 'border-white/20 bg-white/5 text-slate-200'}`}>{label}</button>)}</div>
      <p className="text-sm text-slate-400">{category==='popular' ? 'Popularidad dentro del club, medida por el número de reseñas.' : category==='acclaimed' ? 'Promedio comunitario de al menos 8/10. El orden también considera cuántas opiniones respaldan la nota.' : data.personalized ? 'Priorizamos la afinidad con tus géneros y después las valoraciones del club.' : 'Una combinación de buena valoración y número de reseñas; una nota aislada no pesa igual que varias opiniones.'} Los lanzamientos que ya calificaste no se repiten.</p>
      {busy ? <p role="status" className="py-10 text-center text-slate-300">Cargando lanzamientos…</p> : !list.length ? <div className="space-y-3 rounded-2xl border border-white/15 p-6"><p>No hay lanzamientos pendientes que coincidan con esta selección.</p><Link to="/catalogo" className="text-cyan-200 underline">Explorar el catálogo</Link></div> : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.slice((Math.min(page,pageCount)-1)*12,Math.min(page,pageCount)*12).map(album => <article key={album.id} className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-slate-950/70 p-4" data-recommended-release={album.id}>
          <div className="flex items-start gap-4"><Link to={getReleaseUrl(album)} className="w-24 shrink-0"><CoverImage src={album.image_url || album.imagen} alt={album.album_name || album.album} width={112} height={112} sizes="112px" className="aspect-square w-full rounded-xl object-cover" /></Link><div className="min-w-0 space-y-1"><h3 className="break-words text-lg font-extrabold" translate="no"><Link to={getReleaseUrl(album)}>{album.album_name || album.album}</Link></h3><p className="text-sm text-slate-300" translate="no">{album.artist_name || album.artista}</p><p className="text-sm text-amber-200">{album.communityAverage !== null ? `${album.communityAverage.toFixed(1)}/10` : 'Sin valoraciones'} · {album.review_count || 0} reseñas</p></div></div>
          <div className="flex flex-wrap gap-1.5">{genres.normalizeGenres(album.genres).slice(0,4).map(genre => <span key={genre} translate="no" className="rounded-full border border-purple-300/20 bg-purple-500/15 px-2 py-1 text-xs text-purple-200">{genre}</span>)}</div>
          <p className="grow text-sm text-slate-300">{album.recommendationReason}</p>
          <div className="flex flex-wrap gap-2"><Link to={getReleaseUrl(album)} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-bold">Ver lanzamiento</Link><button onClick={()=>setSelected(album)} className="min-h-11 rounded-xl bg-pink-600 px-4 text-sm font-bold">Calificar</button></div>
        </article>)}</div>
        {pageCount>1 && <nav aria-label="Páginas de recomendaciones" className="flex items-center justify-center gap-4"><button disabled={page<=1} onClick={()=>setPage(value=>value-1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Anterior</button><span>{Math.min(page,pageCount)} / {pageCount}</span><button disabled={page>=pageCount} onClick={()=>setPage(value=>value+1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Siguiente</button></nav>}
      </>}
    </section>
    {selected && <dialog ref={dialogRef} aria-labelledby="recommendation-review-title" onCancel={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)setSelected(null);}} className="fixed inset-0 m-auto max-h-[90vh] w-[min(94vw,48rem)] overflow-y-auto rounded-3xl border border-white/20 bg-[#121424] p-5 text-white backdrop:bg-black/80">
      <div className="mb-4 flex items-center justify-between gap-4"><h2 id="recommendation-review-title" className="text-xl font-bold" translate="no">{selected.album_name || selected.album}</h2><button aria-label="Cerrar valoración" onClick={()=>setSelected(null)} className="min-h-11 min-w-11 rounded-xl border border-white/20">✕</button></div>
      <ReviewSystem album={selected} isIndividual={true} user={user} onReviewSubmitted={()=>{setSelected(null);refresh();}} />
    </dialog>}
    {isPage && <Footer />}
  </div>;
}
export default Recommendations;
