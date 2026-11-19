'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {CoverImage} from './CoverImage';
import {annualReleaseDateLabel} from '../utils/annualPresentation.mjs';
import genres from '../utils/genreCatalog.cjs';
import {getReleaseUrl} from '../utils/ratingUtils';
import styles from '../views/AnnualPage.module.css';
import rail from './AnnualCollection.module.css';
const pathFor=r=>r.catalogPath||(r.catalogId?getReleaseUrl({id:r.catalogId,album_name:r.title,artist_name:r.artist,release_type:r.release_type}):`/catalogo?${new URLSearchParams({q:`${r.title} ${r.artist}`,tab:'releases'})}`);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

function ReleaseCard({release,index,scope,collectionId}){
  const [official,setOfficial]=useState(false),genre=(genres.normalizeGenres([release.genre])[0]||release.genre||'Música').replace(/\br&b\b/gi,'R&B'),stats=release.stats;
  return <article id={`release-${collectionId}-${release.id}`} data-rank={release.rank} className={`${styles.releaseCard} ${rail.card}`} style={{'--scene-color':['#ed9dbe','#a3dfcf','#d0c1eb','#eed47f'][index%4]}}>
    <span data-genre-backdrop className={styles.releaseBackdrop} style={{"--genre-length":Math.max(6,Array.from(genre||"Música").length)}} aria-hidden="true">{genre}</span>
    <div className={styles.releaseArt}>{official?<CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 600px) 72vw, 400px"/>:<div className={styles.sleeve}><GenreArtwork genre={genre} size={340} animated rotateLabel className={styles.sleeveVinyl}/><div className={styles.sleeveFront}><CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 700px) 64vw, 480px"/></div></div>}<span className={styles.genreArt}><GenreArtwork genre={genre} size={100} animated rotateLabel/></span><button type="button" onClick={()=>setOfficial(v=>!v)} aria-label={`${official?'Ver edición Musiclub':'Ver portada original'} de ${release.title}`} className={styles.artToggle}><UiIcon name={official?'disc':'image'} size={25}/>{official?'Edición Musiclub':'Portada'}</button></div>
    <div className={styles.releaseCopy}>
      <div className={rail.rank}><span>#{String(release.rank).padStart(2,'0')}</span><div><UiIcon name={release.rank===1?'crown':'disc'} size={32}/><strong>{scope==='global'?'PANORAMA GLOBAL':'RANKING DEL CLUB'}<small>{genre}</small></strong></div></div>
      <div className={styles.releaseMeta}><UiIcon name="calendar" size={26}/><time dateTime={release.releaseDate||undefined}>{annualReleaseDateLabel(release)}</time></div>
      <h3>{release.title}</h3><p className={styles.artist}>{release.artist}</p>
      <div className={rail.stats} aria-label={`Estadísticas de ${release.title}`}>
        {scope==='global'?<><div><UiIcon name="globe"/><strong>{release.global?.user?.score??'—'}<small>/100</small></strong><span>AOTY · usuarios</span></div><div><UiIcon name="users"/><strong>{release.global?.user?.countDisplay||'—'}</strong><span>valoraciones globales</span></div><div><UiIcon name="star"/><strong>{stats?.meanScore==null?'—':stats.meanScore.toFixed(2)}<small>/10</small></strong><span>Musiclub · {stats?stats.reviewCount+(stats.reviewCount===1?' reseña':' reseñas'):'no disponible'}</span></div></>:<><div><UiIcon name="star"/><strong>{stats?.meanScore==null?'—':stats.meanScore.toFixed(2)}<small>/10</small></strong><span>nota del club</span></div><div><UiIcon name="review"/><strong>{stats?stats.reviewCount:'—'}</strong><span>{stats?.reviewCount===1?'reseña':'reseñas'}</span></div><div><UiIcon name="music"/><strong>{stats?.trackCount??'—'}</strong><span>{stats?.trackCount===1?'track del release':'tracks del release'}</span></div></>}
      </div>
      {scope==='club'&&release.global?.user&&<p className={rail.connection}><UiIcon name="globe"/>AOTY <strong>{release.global.user.score}/100</strong><span>· {release.global.user.countDisplay} valoraciones</span></p>}
      {stats?.favoriteTrack?<div className={rail.favorite}><UiIcon name="heart"/><span>Favorita del club<strong>{stats.favoriteTrack.name}</strong></span><b>{stats.favoriteTrack.count} {stats.favoriteTrack.count===1?'voto':'votos'}</b></div>:<p className={rail.note}>{stats?.reviewCount?'Todavía no hay una canción favorita registrada.':stats?'Aún sin reseñas del club. Tu opinión puede ser la primera.':'Las estadísticas del club no están disponibles.'}</p>}
      <div className={styles.releaseActions}><Link href={pathFor(release)}>Escuchar y reseñar <UiIcon name="arrow" size={28}/></Link><span className={rail.year}>{scope==='global'?'AOTY + Musiclub':'Musiclub · 2026'}</span></div>
    </div>
  </article>;
}
export function AnnualCollection({selection=[],id='seleccion',scope='club',title='El ranking del club',subtitle='Desde una reseña · Nota ponderada'}){
  const host=useRef(null),stage=useRef(null),track=useRef(null),[active,setActive]=useState(0);
  const ranked=selection.map((r,i)=>({...r,rank:r.rank||i+1})).sort((a,b)=>b.rank-a.rank);
  useEffect(()=>{
    if(!selection.length)return;
    const section=host.current,viewport=stage.current,strip=track.current,scroller=section.closest('main');let frame=0,last=-1;
    const update=()=>{
      frame=0;const bounds=section.getBoundingClientRect(),root=scroller.getBoundingClientRect(),distance=Math.max(1,section.offsetHeight-scroller.clientHeight),progress=clamp((root.top-bounds.top)/distance,0,1);
      strip.style.transform=`translate3d(${-progress*Math.max(0,strip.scrollWidth-viewport.clientWidth)}px,0,0)`;
      const current=Math.round(progress*(ranked.length-1));
      if(current!==last){last=current;setActive(current);Array.from(strip.children).forEach((panel,i)=>{panel.inert=i!==current;panel.setAttribute('aria-hidden',String(i!==current));});}
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const resize=()=>{section.style.height=`${scroller.clientHeight*(1+Math.max(0,ranked.length-1)*.8)}px`;schedule();};
    const observer=new ResizeObserver(resize);observer.observe(viewport);scroller.addEventListener('scroll',schedule,{passive:true});resize();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();scroller.removeEventListener('scroll',schedule);};
  },[selection,ranked.length]);
  if(!selection.length)return <section id={id} data-annual-scene data-chapter={scope==='global'?'panorama':'seleccion'} className={rail.empty}><h2>{title}</h2><p>Todavía no hay releases con reseñas de 2026 para este ranking.</p></section>;
  const go=index=>{
    const section=host.current,scroller=section.closest('main'),target=clamp(index,0,ranked.length-1),top=scroller.scrollTop+section.getBoundingClientRect().top-scroller.getBoundingClientRect().top,progress=target/Math.max(1,ranked.length-1);
    scroller.scrollTo({top:top+progress*(section.offsetHeight-scroller.clientHeight),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  return <section ref={host} id={id} data-annual-scene data-chapter={scope==='global'?'panorama':'seleccion'} data-horizontal-ranking className={rail.collection} aria-label={`${title}, del último puesto al primero`}>
    <div ref={stage} className={rail.stage}>
      <div className={rail.toolbar} data-annual-icons="light"><span><UiIcon name="disc"/><strong>{title}<small>{subtitle}</small></strong></span><div><span aria-live="polite">#{ranked[active]?.rank||'—'} <small>de {ranked.length}</small></span><button type="button" aria-label="Puesto anterior del ranking" disabled={active===0} onClick={()=>go(active-1)}><UiIcon name="arrowLeft"/></button><button type="button" aria-label="Siguiente puesto del ranking" disabled={active===ranked.length-1} onClick={()=>go(active+1)}><UiIcon name="arrow"/></button></div></div>
      <div ref={track} className={rail.track}>{ranked.map((release,i)=><div key={release.id} inert={i!==0} aria-hidden={i!==0} data-ranking-panel><ReleaseCard release={release} index={i} scope={scope} collectionId={id}/></div>)}</div>
      <div className={rail.progress} aria-hidden="true"><i style={{width:`${(active+1)/Math.max(1,ranked.length)*100}%`}}/></div>
      <span className={rail.hint}><UiIcon name="arrowDown"/>{active===ranked.length-1?'Sigue bajando para continuar con el año':'Baja para descubrir el siguiente puesto'}</span>
    </div>
  </section>;
}
