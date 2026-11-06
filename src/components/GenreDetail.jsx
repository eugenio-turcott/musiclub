'use client';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import {AdsterraAdvertising} from './AdsterraAdvertising';
import { Footer } from './Footer';
import { GenreVinylViewer } from './GenreVinylViewer';
import { GenreReleaseCard } from './GenreReleaseCard';
import {LandingMotion, useLandingMotion} from './LandingExperience';
import {CoverImage} from './CoverImage';
import {UiIcon} from './UiIcon';
import {getReleaseUrl} from '../utils/ratingUtils';
import visuals from '../utils/genreVisuals.cjs';
import styles from './GenreHero.module.css';

export function GenreDetail({ genre, albums }) {
  return <LandingMotion><GenreExperience key={genre.id} genre={genre} albums={albums}/></LandingMotion>;
}

function GenreExperience({genre,albums}) {
  const [page, setPage] = useState(1), [search,setSearch]=useState(''), [reviewedOnly,setReviewedOnly]=useState(false), [sort,setSort]=useState('club');
  const motion=useLandingMotion();
  const reviewed=albums.filter(album=>album.review_count>0), featured=[...reviewed].sort((a,b)=>b.final_rating-a.final_rating)[0];
  const filtered=useMemo(()=>{
    const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
    const query=normalize(search);
    const list=albums.filter(a=>(!reviewedOnly||a.review_count>0)&&normalize(`${a.album_name} ${a.artist_name}`).includes(query));
    return list.sort((a,b)=>sort==='recent'?String(b.release_date||b.release_year||'').localeCompare(String(a.release_date||a.release_year||'')):sort==='rating'?(b.final_rating||0)-(a.final_rating||0):b.review_count-a.review_count);
  },[albums,search,reviewedOnly,sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const setFilter=(setter,value)=>{setter(value);setPage(1);};
  const pressing = visuals.genreRevealArtwork(genre.id);
  return <div className={`min-h-screen p-3 sm:p-6 ${styles.page}`} style={{'--genre-color':pressing.base, '--genre-accent':pressing.accent, '--genre-light':pressing.highlight}}>
    <div className="mx-auto w-full max-w-7xl space-y-6">
    <AppHeader showTitle={false} showAdvertising={albums.length>0} />
    <section className={styles.hero} aria-labelledby="genre-title" data-landing-scene="">
      <Link to="/catalogo?tab=genres" className={styles.back}><span aria-hidden="true">←</span> Explorar géneros</Link>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span className={styles.dot} aria-hidden="true" />{albums.length} {albums.length === 1 ? 'lanzamiento del club' : 'lanzamientos del club'}</p>
          <h1 id="genre-title" translate="no" className={styles.title}>{genre.name}</h1>
          <p className={styles.description}>Explora {genre.name} en Musiclub. Discos, reseñas y canciones favoritas de quienes también lo escuchan.</p>
          <div className={styles.heroActions}>{albums.length>0&&<a href="#genre-releases" className={styles.action}>Explorar releases <UiIcon name="arrowDown" size={21} tone="inherit"/></a>}{albums.length > 0 && <Link to={'/gashapon?genero='+encodeURIComponent(genre.id)} className={styles.secondary}><UiIcon name="gashapon" size={21} tone="inherit"/>Abrir Gashapon</Link>}</div>
          <div className={styles.metrics}><span><UiIcon name="disc" size={25} tone="inherit"/><b>{albums.length}</b>releases</span><span><UiIcon name="review" size={25} tone="inherit"/><b>{reviewed.length}</b>con reseñas</span><span><UiIcon name="users" size={25} tone="inherit"/><b>{new Set(albums.map(a=>a.artist_name)).size}</b>artistas</span></div>
        </div>
        <div className={styles.visual}><span className={styles.orbit} aria-hidden="true"/><GenreVinylViewer genre={genre} className={styles.vinyl} /><span className={styles.vinylCaption}><UiIcon name="disc" size={19} tone="inherit"/>Acércate. Gíralo. Explora su diseño.</span></div>
      </div>
      <button type="button" className={styles.motion} onClick={motion.toggle} aria-pressed={motion.paused}><UiIcon name={motion.paused?'play':'pause'} size={16} tone="inherit"/>{motion.paused?'Activar animaciones':'Pausar animaciones'}</button>
    </section>
    {featured&&<section className={styles.spotlight} data-landing-scene="" aria-labelledby="genre-spotlight-title"><div className={styles.spotlightArt}><CoverImage src={featured.image_url} alt={featured.album_name}/><span><UiIcon name="star" size={23} tone="inherit"/>{Number(featured.final_rating).toFixed(1)}<small>/10</small></span></div><div><p className={styles.eyebrow}><UiIcon name="crown" size={20} tone="inherit"/>DESTACADO POR EL CLUB</p><h2 id="genre-spotlight-title">{featured.album_name}</h2><p>{featured.artist_name}</p><span>{featured.review_count} {featured.review_count===1?'reseña de la comunidad':'reseñas de la comunidad'}</span><Link to={getReleaseUrl(featured)} className={styles.featureLink}>Ver release y reseñas <UiIcon name="arrow" size={22} tone="inherit"/></Link></div><div className={styles.coverStack} aria-hidden="true">{reviewed.filter(a=>a.id!==featured.id).slice(0,3).map((a,i)=><CoverImage src={a.image_url} alt="" key={a.id} style={{'--i':i}}/>)}</div></section>}
    <section id="genre-releases" className={styles.explorer} aria-labelledby="genre-releases-title"><header><div><p className={styles.eyebrow}>ENCUENTRA TU PRÓXIMO DISCO</p><h2 id="genre-releases-title">Releases de {genre.name}</h2></div><span>{filtered.length} resultados</span></header><div className={styles.filters}><label><UiIcon name="search" size={22} tone="inherit"/><span className="sr-only">Buscar en este género</span><input value={search} onChange={event=>setFilter(setSearch,event.target.value)} placeholder="Busca un release o artista"/></label><div className={styles.filterTabs}><button type="button" aria-pressed={!reviewedOnly} onClick={()=>setFilter(setReviewedOnly,false)}>Todos</button><button type="button" aria-pressed={reviewedOnly} onClick={()=>setFilter(setReviewedOnly,true)}>Con reseñas</button></div><select aria-label="Ordenar releases del género" value={sort} onChange={event=>setFilter(setSort,event.target.value)}><option value="club">Más reseñados</option><option value="rating">Mejor calificados</option><option value="recent">Más recientes</option></select></div></section>
    {albums.length>0&&<AdsterraAdvertising variant="inline" slot="genre-releases"/>}
    {!filtered.length ? <p className={styles.empty}>{albums.length?'No encontramos releases con estos filtros. Prueba otra búsqueda.':'Este género aún no tiene lanzamientos en el club.'}</p> : <section aria-label={`Lanzamientos de ${genre.name}`} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 ${styles.releaseGrid}`} data-landing-scene="">
      {filtered.slice((page-1)*24,page*24).map((album,i) => <div className={styles.releaseEntry} style={{'--i':i}} key={album.id}><GenreReleaseCard album={album} /></div>)}
    </section>}
    {pages > 1 && <nav aria-label="Páginas de lanzamientos" className="flex items-center justify-center gap-4 text-sm"><button disabled={page===1} onClick={()=>setPage(value=>value-1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(value=>value+1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Siguiente</button></nav>}
    <Footer showAd={albums.length > 0} />
    </div>
  </div>;
}
