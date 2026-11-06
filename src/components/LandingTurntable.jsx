'use client';
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {CoverImage} from './CoverImage';
import {UiIcon} from './UiIcon';
import MoodIcon from './MoodIcon';
import {getEmotionFromReview, getReleaseUrl} from '../utils/ratingUtils';
import {displayRelease} from '../utils/landingExperience.mjs';
import {listeningTrack} from '../utils/listeningPreview.mjs';
import visuals from '../utils/genreVisuals.cjs';
import styles from './LandingTurntable.module.css';

const previews = new Map();
async function previewFor(id) {
  if (!previews.has(id)) {
    if (previews.size > 30) previews.delete(previews.keys().next().value);
    const request = fetch(`/api/listening-preview?album=${encodeURIComponent(id)}`).then(async response => {
      if (!response.ok) throw new Error('preview unavailable');
      return (await response.json()).preview;
    }).catch(error => {previews.delete(id);throw error;});
    previews.set(id, request);
  }
  return previews.get(id);
}

function Player({entry}) {
  const {album, review, reviews} = entry, release = displayRelease(album);
  const track = listeningTrack(album, reviews), art = visuals.genreRevealArtwork(release.genres[0] || 'Pop');
  const audio = useRef(null), scene = useRef(null), wanted = useRef(false), mounted = useRef(true), drag = useRef(null), ignoreClick = useRef(false);
  const [down,setDown] = useState(false), [playing,setPlaying] = useState(false), [status,setStatus] = useState('idle'), [preview,setPreview] = useState(null), [progress,setProgress] = useState(0);
  const lift = () => {wanted.current=false;setDown(false);audio.current?.pause();};
  useEffect(() => {
    mounted.current=true;
    const element=audio.current, visibility=()=>{if(document.hidden)lift();};
    document.addEventListener('visibilitychange',visibility);
    const observer = new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)lift();},{threshold:0});
    observer.observe(scene.current);
    return()=>{mounted.current=false;wanted.current=false;element?.pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const lower = async () => {
    if (!track) return;
    wanted.current=true;setDown(true);
    try {
      let result=preview;
      if (!result) {setStatus('loading');result=await previewFor(album.id);}
      if (!mounted.current) return;
      if (!result) {setStatus('unavailable');lift();return;}
      setPreview(result);setStatus('ready');
      if (!wanted.current) return;
      const element=audio.current;
      if(element.src!==result.url)element.src=result.url;
      try {await element.play();}
      catch(error) {if(mounted.current){lift();setStatus(error.name==='NotAllowedError'?'gesture':'error');}}
    } catch {if(mounted.current){setStatus('error');lift();}}
  };
  const toggle = () => down ? lift() : lower();
  const statusText = status==='loading'?'Buscando la muestra…':status==='unavailable'?'Esta canción no tiene muestra disponible.':status==='error'?'No se pudo reproducir. Puedes volver a intentarlo.':status==='gesture'?'Pulsa reproducir para escuchar la muestra.':playing?'Escuchando una muestra del release':track?'Baja la aguja para escuchar una muestra':'Este release aún no tiene una canción top.';
  return <div ref={scene} className={styles.player} data-playing={playing} data-needle-down={down}>
    <div className={styles.deckArea}>
      <div className={styles.halo} aria-hidden="true"/>
      <div className={styles.deck}>
        <div className={styles.brand}><span><img src="/musiclub_logo_corchea.png" alt="" width="24" height="24"/>MUSICLUB</span><small>ESTÉREO · 33⅓</small></div>
        <div className={styles.platter} aria-hidden="true"><img data-turntable-record="" className={styles.record} src={art.disc} alt=""/><img className={styles.motif} src={art.center} alt=""/><i className={styles.spindle}/></div>
        <button type="button" className={styles.needle} aria-label={down?'Levantar aguja y pausar':'Bajar aguja y escuchar muestra'} aria-pressed={down} disabled={!track} title="Pulsa o arrastra la aguja"
          onClick={()=>{if(ignoreClick.current){ignoreClick.current=false;return;}toggle();}}
          onPointerDown={event=>{drag.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
          onPointerUp={event=>{const from=drag.current;drag.current=null;if(from&&Math.hypot(event.clientX-from.x,event.clientY-from.y)>12){ignoreClick.current=true;toggle();}}}
          onPointerCancel={()=>{drag.current=null;}}><span className={styles.needleAssembly}><span className={styles.pivot}/><span className={styles.arm}/><span className={styles.cartridge}/></span></button>
        <div className={styles.deckFoot}><span className={styles.power}/><div className={styles.equalizer} aria-hidden="true">{Array.from({length:15},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><span>33 <i/>45</span></div>
      </div>
      <span className={styles.needleHint}><UiIcon name="arrow" size={17} tone="inherit"/>Pulsa o arrastra la aguja</span>
    </div>
    <div className={styles.releasePanel}>
      <Link to={getReleaseUrl(album)} className={styles.release} aria-label={`Ver release: ${release.title}`}><CoverImage src={release.image} alt={release.title} sizes="76px" loading="eager"/><span><strong>{release.title}</strong><small>{release.artist}</small></span><UiIcon name="arrow" size={20} tone="inherit"/></Link>
      <div className={styles.facts}><span><UiIcon name="star" size={21} tone="inherit"/><b>{Number(album.final_rating || 0).toFixed(1)}<small>/10</small></b><small>{album.review_count} {album.review_count===1?'reseña':'reseñas'}</small></span><span><MoodIcon mood={getEmotionFromReview(review).id} size={31}/><small>{getEmotionFromReview(review).label || 'Ánimo del club'}</small></span></div>
      <div className={styles.listen}><button type="button" onClick={toggle} disabled={!track} aria-label={down?'Pausar muestra':'Reproducir muestra'} aria-pressed={playing}><UiIcon name={down?'pause':'play'} size={25} tone="inherit"/></button><div><span>{track?.reason || 'Canción top del club'}</span><strong>{track?.name || 'Aún sin canciones calificadas'}</strong><p role="status">{statusText}</p></div></div>
      <div className={styles.progress} role="progressbar" aria-label="Progreso de la muestra" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{transform:`scaleX(${progress/100})`}}/></div>
      {preview&&<div className={styles.provider}><a href={preview.storeUrl} target="_blank" rel="noopener noreferrer"><img src="/itunes-store-badge-es.svg" width="110" height="40" alt="Consíguelo en iTunes Store"/></a><small>Muestra cortesía de iTunes<br/>provided courtesy of iTunes</small></div>}
      {(status==='unavailable'||status==='error')&&album.spotify_link&&<a className={styles.fallback} href={album.spotify_link} target="_blank" rel="noopener noreferrer">Escuchar el release en Spotify <UiIcon name="arrow" size={17} tone="inherit"/></a>}
    </div>
    <audio ref={audio} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{lift();setProgress(0);}} onTimeUpdate={event=>{const a=event.currentTarget;setProgress(a.duration?Math.min(100,a.currentTime/a.duration*100):0);}} onError={()=>{setStatus('error');lift();}}/>
  </div>;
}

export function LandingTurntable({selection}) {
  const [index,setIndex]=useState(0);
  const selected=selection[index%Math.max(1,selection.length)];
  return <div className={styles.studio} aria-label="Tornamesa interactiva de Musiclub">
    {selected?<Player key={selected.album.id} entry={selected}/>:<p>Los releases con reseñas aparecerán aquí.</p>}
    <div className={styles.library}><header><span><UiIcon name="shuffle" size={17} tone="inherit"/>Selección aleatoria del club</span><span>{selected?index%selection.length+1:0} / {selection.length}</span></header><div className={styles.picker} aria-label="Releases de la tornamesa">{selection.map(({album},i)=><button type="button" key={album.id} aria-label={`Mostrar ${displayRelease(album).title} en la tornamesa`} aria-pressed={index%selection.length===i} onClick={()=>setIndex(i)}><CoverImage src={displayRelease(album).image} alt="" sizes="58px"/><span>{i+1}</span></button>)}</div></div>
  </div>;
}
