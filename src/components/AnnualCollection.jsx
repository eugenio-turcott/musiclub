'use client';
import Link from 'next/link';
import {memo,useEffect,useMemo,useRef,useState} from 'react';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {CoverImage} from './CoverImage';
import {annualReleaseDateLabel,annualPersonalRankingCopy} from '../utils/annualPresentation.mjs';
import genres from '../utils/genreCatalog.cjs';
import {getReleaseUrl} from '../utils/ratingUtils';
import styles from '../views/AnnualPage.module.css';
import rail from './AnnualCollection.module.css';
const pathFor=r=>r.catalogPath||(r.catalogId?getReleaseUrl({id:r.catalogId,album_name:r.title,artist_name:r.artist,release_type:r.release_type}):`/catalogo?${new URLSearchParams({q:`${r.title} ${r.artist}`,tab:'releases'})}`);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

const ReleaseCard=memo(function ReleaseCard({release,index,scope,collectionId,message}){
  const [official,setOfficial]=useState(false),genre=(genres.normalizeGenres([release.genre])[0]||release.genre||'Música').replace(/\br&b\b/gi,'R&B'),stats=release.stats;
  return <article id={`release-${collectionId}-${release.id}`} data-rank={release.rank} data-long-title={release.title.length>75} className={`${styles.releaseCard} ${rail.card}`} style={{'--scene-color':['#ed9dbe','#a3dfcf','#d0c1eb','#eed47f'][index%4]}}>
    <span data-genre-backdrop className={styles.releaseBackdrop} style={{"--genre-length":Math.max(6,Array.from(genre||"Música").length)}} aria-hidden="true">{genre}</span>
    <div className={styles.releaseArt}>{official?<CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 600px) 72vw, 400px"/>:<div className={styles.sleeve}><GenreArtwork genre={genre} size={340} animated rotateLabel className={styles.sleeveVinyl}/><div className={styles.sleeveFront}><CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 700px) 64vw, 480px"/></div></div>}<span className={styles.genreArt}><GenreArtwork genre={genre} size={100} animated rotateLabel/></span><button type="button" onClick={()=>setOfficial(v=>!v)} aria-label={`${official?'Ver edición Musiclub':'Ver portada original'} de ${release.title}`} className={styles.artToggle}><UiIcon name={official?'disc':'image'} size={25}/>{official?'Edición Musiclub':'Portada'}</button></div>
    <div className={styles.releaseCopy}>
      <div className={rail.rank}><span>#{String(release.rank).padStart(2,'0')}</span><div><UiIcon name={release.rank===1?'crown':scope==='personal'?'user':'disc'} size={32}/><strong>{scope==='global'?'PANORAMA GLOBAL':scope==='personal'?'TU RANKING PERSONAL':'RANKING DEL CLUB'}<small>{genre}</small></strong></div></div>
      <div className={styles.releaseMeta}><UiIcon name="calendar" size={26}/><time dateTime={release.releaseDate||undefined}>{annualReleaseDateLabel(release)}</time></div>
      <h3>{release.title}</h3><p className={styles.artist}>{release.artist}</p>
      {scope==='personal'&&message&&<p className={rail.personalMessage}>{message}</p>}
      <div className={rail.stats} aria-label={`Estadísticas de ${release.title}`}>
        {scope==='global'?<><div><UiIcon name="globe"/><strong>{release.global?.user?.score??'—'}<small>/100</small></strong><span>Valoración externa</span></div><div><UiIcon name="users"/><strong>{release.global?.user?.countDisplay||'—'}</strong><span>valoraciones fuera de Musiclub</span></div><div><UiIcon name="star"/><strong>{stats?.meanScore==null?'—':stats.meanScore.toFixed(2)}<small>/10</small></strong><span>Musiclub · {stats?stats.reviewCount+(stats.reviewCount===1?' reseña':' reseñas'):'no disponible'}</span></div></>:<><div><UiIcon name="star"/><strong>{stats?.meanScore==null?'—':stats.meanScore.toFixed(2)}<small>/10</small></strong><span>{scope==='personal'?'tu nota':'nota del club'}</span></div><div><UiIcon name={scope==='personal'?'headphones':'review'}/><strong>{scope==='personal'?stats?.trackRatingCount??0:stats?stats.reviewCount:'—'}</strong><span>{scope==='personal'?'tracks que calificaste':stats?.reviewCount===1?'reseña':'reseñas'}</span></div><div><UiIcon name="music"/><strong>{stats?.trackCount??'—'}</strong><span>{stats?.trackCount===1?'track del release':'tracks del release'}</span></div></>}
      </div>
      {stats?.favoriteTrack?<div className={rail.favorite}><UiIcon name="heart"/><span>{scope==='personal'?'Tu canción favorita':'Favorita del club'}<strong>{stats.favoriteTrack.name}</strong></span>{scope!=='personal'&&<b>{stats.favoriteTrack.count} {stats.favoriteTrack.count===1?'voto':'votos'}</b>}</div>:scope!=='personal'&&<p className={rail.note}>{stats?.reviewCount?'Todavía no hay una canción favorita registrada.':stats?'Aún sin reseñas del club. Tu opinión puede ser la primera.':'Las estadísticas del club no están disponibles.'}</p>}
      <div className={styles.releaseActions}><Link href={pathFor(release)}>{scope==='personal'?'Ver tu reseña':'Escuchar y reseñar'} <UiIcon name="arrow" size={28}/></Link><span className={rail.year}>{scope==='global'?'Datos externos + Musiclub':scope==='personal'?'Tus notas · 2026':'Musiclub · 2026'}</span></div>
    </div>
  </article>;
});
export function AnnualCollection({selection=[],id='seleccion',scope='club',title='El ranking del club',subtitle='Álbumes de 2026 · Nota ponderada',message}){
  const host=useRef(null),stage=useRef(null),track=useRef(null),progressBar=useRef(null),[active,setActive]=useState(0);
  const ranked=useMemo(()=>selection.map((r,i)=>({...r,rank:r.rank||i+1})).sort((a,b)=>b.rank-a.rank),[selection]);
  useEffect(()=>{
    if(!selection.length)return;
    const section=host.current,viewport=stage.current,strip=track.current,scroller=section.closest('main'),panels=Array.from(strip.children),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,last=-1,position=0,lastTime=0,start=0,distance=1,travel=0,width=1,height=1,snap=true,disposed=false,touching=false;
    const draw=time=>{
      frame=0;if(document.hidden)return;
      const scroll=scroller.scrollTop,target=clamp((scroll-start)/distance,0,1)*travel;
      const elapsed=lastTime?Math.min(64,time-lastTime):1000/60;lastTime=time;
      // Ease wheel steps without intercepting native scrolling or adding inertia
      // to touch input. Anchors, resizing and reduced motion settle immediately.
      const immediate=snap||touching||motion.matches||scroll<start-height||scroll>start+distance+height||Math.abs(target-position)>width*2;
      position=immediate?target:position+(target-position)*(1-Math.exp(-elapsed/55));snap=false;
      if(Math.abs(target-position)<.1)position=target;
      strip.style.transform=`translate3d(${-position}px,0,0)`;
      const progress=travel?position/travel:0,current=Math.round(progress*(ranked.length-1));
      if(progressBar.current)progressBar.current.style.transform=`scaleX(${(1+progress*(ranked.length-1))/ranked.length})`;
      if(current!==last){last=current;setActive(current);panels.forEach((panel,i)=>{panel.inert=i!==current;panel.setAttribute('aria-hidden',String(i!==current));panel.dataset.near=String(Math.abs(i-current)<=1);});}
      if(position!==target)frame=requestAnimationFrame(draw);else lastTime=0;
    };
    const schedule=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);};
    const measure=()=>{
      if(disposed)return;
      height=scroller.clientHeight;const sectionHeight=height*(1+Math.max(0,ranked.length-1)*.8);
      if(section.style.height!==`${sectionHeight}px`)section.style.height=`${sectionHeight}px`;
      start=scroller.scrollTop+section.getBoundingClientRect().top-scroller.getBoundingClientRect().top;
      distance=Math.max(1,sectionHeight-height);width=viewport.clientWidth;travel=Math.max(0,strip.scrollWidth-width);snap=true;schedule();
    };
    const visibility=()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;snap=true;schedule();};
    const touchStart=()=>{touching=true;},touchEnd=()=>{touching=false;};
    const observer=new ResizeObserver(measure);observer.observe(viewport);observer.observe(scroller);
    const intersection=new IntersectionObserver(entries=>{section.dataset.railVisible=String(entries[0].isIntersecting);if(entries[0].isIntersecting)measure();},{root:scroller});intersection.observe(section);
    scroller.addEventListener('scroll',schedule,{passive:true});scroller.addEventListener('touchstart',touchStart,{passive:true});scroller.addEventListener('touchend',touchEnd,{passive:true});scroller.addEventListener('touchcancel',touchEnd,{passive:true});document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',measure);document.fonts?.ready.then(measure);measure();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();scroller.removeEventListener('scroll',schedule);scroller.removeEventListener('touchstart',touchStart);scroller.removeEventListener('touchend',touchEnd);scroller.removeEventListener('touchcancel',touchEnd);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',measure);};
  },[selection,ranked.length]);
  const chapter=scope==='global'?'panorama':scope==='personal'?'mi-ranking':'seleccion';
  if(!selection.length)return <section id={id} data-annual-scene data-chapter={chapter} data-annual-icons="light" className={rail.empty}><GenreArtwork genre={scope==='personal'?'Pop':'Rock'} size={110} animated rotateLabel/><h2>{title}</h2><p>{message||'Todavía no hay álbumes de 2026 con reseñas para este ranking.'}</p>{scope==='personal'&&<div className={rail.emptyActions}><Link href="/catalogo">Encontrar un álbum <UiIcon name="search"/></Link><a href="#seleccion">Ver el ranking del club <UiIcon name="arrowDown"/></a></div>}</section>;
  const go=index=>{
    const section=host.current,scroller=section.closest('main'),target=clamp(index,0,ranked.length-1),top=scroller.scrollTop+section.getBoundingClientRect().top-scroller.getBoundingClientRect().top,progress=target/Math.max(1,ranked.length-1);
    scroller.scrollTo({top:top+progress*(section.offsetHeight-scroller.clientHeight),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  return <section ref={host} id={id} data-annual-scene data-chapter={chapter} data-scope={scope} data-horizontal-ranking className={rail.collection} aria-label={`${title}, del último puesto al primero`}>
    <div ref={stage} className={rail.stage}>
      <div className={rail.toolbar} data-ranking-toolbar data-annual-icons="light"><span><UiIcon name="disc"/><strong>{title}<small>{subtitle}</small></strong></span><div><span aria-live="polite">#{ranked[active]?.rank||'—'} <small>de {ranked.length}</small></span><button type="button" aria-label="Puesto anterior del ranking" disabled={active===0} onClick={()=>go(active-1)}><UiIcon name="arrowLeft"/></button><button type="button" aria-label="Siguiente puesto del ranking" disabled={active===ranked.length-1} onClick={()=>go(active+1)}><UiIcon name="arrow"/></button></div></div>
      <div ref={track} className={rail.track} data-ranking-track>{ranked.map((release,i)=><div key={release.id} inert={i!==0} aria-hidden={i!==0} data-near={i<=1} data-ranking-panel><ReleaseCard release={release} index={i} scope={scope} collectionId={id} message={message}/></div>)}</div>
      <div className={rail.progress} aria-hidden="true"><i ref={progressBar}/></div>
      <span className={rail.hint}><UiIcon name="arrowDown"/>{active===ranked.length-1?'Sigue bajando para continuar con el año':'Baja para descubrir el siguiente puesto'}</span>
    </div>
  </section>;
}

export function AnnualPersonalRanking({personal}){
  const ranking=personal?.albumRanking,copy=annualPersonalRankingCopy(ranking?.total||0,personal?.name||'');
  return <AnnualCollection id="mi-ranking" scope="personal" selection={ranking?.releases||[]} title={copy.title} subtitle={copy.subtitle} message={personal?copy.message:'No pudimos cargar tus álbumes de 2026. Puedes reintentar desde Actualizar datos.'}/>;
}
