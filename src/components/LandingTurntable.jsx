'use client';
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {CoverImage} from './CoverImage';
import {UiIcon} from './UiIcon';
import MoodIcon from './MoodIcon';
import {getEmotionFromReview, getReleaseUrl} from '../utils/ratingUtils';
import {displayRelease} from '../utils/landingExperience.mjs';
import visuals from '../utils/genreVisuals.cjs';
import styles from './LandingTurntable.module.css';

export function LandingTurntable({selection}) {
  const [index,setIndex]=useState(0), [down,setDown]=useState(true), [effects,setEffects]=useState(false), [gesture,setGesture]=useState(0);
  const scene=useRef(null), sound=useRef(null), drag=useRef(null), ignoreClick=useRef(false), recordButtons=useRef([]), rail=useRef(null);
  const selected=selection[index%Math.max(1,selection.length)], album=selected?.album, release=displayRelease(album);
  const mood=getEmotionFromReview(selected?.review), art=visuals.genreRevealArtwork(release.genres[0]||'Pop');
  const score=album?.final_rating==null?'—':Number(album.final_rating).toFixed(1);

  // Locally synthesized effects: no download or initialization until FX is
  // explicitly enabled. Every tone ends in less than half a second.
  const chime=(kind,force=false)=>{
    if(!effects&&!force)return;
    try {
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      const context=sound.current||(sound.current=new Context());
      const play=()=>{
        if(context.state!=='running'||document.hidden)return;
        const notes=kind==='lift'?[880,659]:kind==='change'?[659,880,1318]:[523,784,1046];
        notes.forEach((frequency,i)=>{
          const oscillator=context.createOscillator(), gain=context.createGain(), start=context.currentTime+i*.055;
          oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
          gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.018,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);
          oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+.24);
          oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        });
      };
      if(context.state==='suspended')context.resume().then(play).catch(()=>{});else play();
    } catch { /* Optional effects never prevent the visual interaction. */ }
  };

  useEffect(()=>{
    const visibility=()=>{if(document.hidden){sound.current?.close().catch(()=>{});sound.current=null;}};
    document.addEventListener('visibilitychange',visibility);
    return()=>{document.removeEventListener('visibilitychange',visibility);sound.current?.close().catch(()=>{});sound.current=null;};
  },[]);

  const needle=value=>{setDown(value);setGesture(n=>n+1);chime(value?'lower':'lift');};
  const choose=i=>{
    if(!selection.length)return;
    const next=(i+selection.length)%selection.length;
    setIndex(next);setDown(true);setGesture(n=>n+1);chime('change');
    const button=recordButtons.current[next], list=rail.current;
    if(button&&list)list.scrollTo({left:Math.max(0,button.offsetLeft-list.offsetLeft-list.clientWidth/2+button.clientWidth/2),behavior:'auto'});
  };

  return <div ref={scene} className={styles.studio} aria-label="Tornamesa interactiva de Musiclub" data-needle-down={down} data-effects-enabled={effects}>
    <div className={styles.halo} aria-hidden="true"/>
    <div className={styles.deck} data-turntable-deck="">
      <header className={styles.brand}>
        <span><img src="/musiclub_logo_corchea.png" alt="" width="25" height="25"/><b>MUSICLUB</b><small>33⅓ · ESTÉREO</small></span>
        <button type="button" className={styles.effects} aria-label={effects?'Silenciar efectos de sonido':'Activar efectos de sonido'} aria-pressed={effects} onClick={()=>{
          if(effects){setEffects(false);sound.current?.close().catch(()=>{});sound.current=null;}
          else{setEffects(true);chime('change',true);}
        }}><UiIcon name="sparkles" size={19} tone="inherit"/><span>FX</span><i/></button>
      </header>

      {album?<Link to={getReleaseUrl(album)} className={styles.display} aria-label={`Ver release: ${release.title}`} data-turntable-display="">
        <CoverImage src={release.image} alt={release.title} sizes="64px" loading="eager"/>
        <span className={styles.displayText} key={album.id}><span className={styles.displayLabel}><i/>{down?'EN GIRO':'ELIGE TU PRÓXIMO DISCO'}</span><strong>{release.title}</strong><small>{release.artist}</small></span>
        <span className={styles.displayIndex}><b>{String(index%selection.length+1).padStart(2,'0')}<small>/{selection.length}</small></b><UiIcon name="arrow" size={19} tone="inherit"/></span>
      </Link>:<div className={styles.display}><p>Los releases con reseñas aparecerán aquí.</p></div>}

      <div className={styles.mechanism}>
        <div className={styles.platter} aria-hidden="true"><div className={styles.record} data-turntable-record=""><img src={art.disc} alt=""/><img className={styles.motif} src={art.center} alt=""/></div><i className={styles.spindle}/>
          {gesture>0&&<span className={styles.magic} key={gesture}>{[0,1,2,3,4,5].map(i=><span key={i} style={{'--i':i}}><UiIcon name="sparkles" size={15} tone="inherit"/></span>)}</span>}
        </div>
        <button type="button" className={styles.needle} aria-label={down?'Levantar aguja':'Bajar aguja'} aria-pressed={down} title="Pulsa o arrastra la aguja" disabled={!album}
          onClick={()=>{if(ignoreClick.current){ignoreClick.current=false;return;}needle(!down);}}
          onPointerDown={event=>{if(event.button!==0)return;drag.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
          onPointerUp={event=>{const from=drag.current;drag.current=null;if(!from)return;const dx=event.clientX-from.x,dy=event.clientY-from.y;if(Math.hypot(dx,dy)>12){ignoreClick.current=true;needle(Math.abs(dx)>Math.abs(dy)?dx<0:dy>0);}}}
          onPointerCancel={()=>{drag.current=null;}}><span className={styles.needleAssembly}><span className={styles.pivot}/><span className={styles.arm}/><span className={styles.cartridge}/></span></button>
      </div>

      <div className={styles.console} data-turntable-console="">
        <button type="button" className={styles.motor} aria-label={down?'Detener vinilo':'Girar vinilo'} aria-pressed={down} disabled={!album} onClick={()=>needle(!down)}><UiIcon name={down?'pause':'play'} size={23} tone="inherit"/><i/></button>
        <div className={styles.visualizer} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>
        <div className={styles.score} aria-label={`Calificación del club: ${score} de 10`}><UiIcon name="star" size={22} tone="inherit"/><strong>{score}<small>/10</small></strong><span>{album?.review_count||0} {album?.review_count===1?'RESEÑA':'RESEÑAS'}</span></div>
        <span className={styles.mood} role="img" aria-label={`Estado de ánimo: ${mood.label}`} title={mood.label}><MoodIcon mood={mood.id} size={42}/></span>
      </div>
      <span className={styles.status} role="status">{down?'Vinilo girando · Aguja sobre el disco':'Pulsa o arrastra la aguja para girar el vinilo'}</span>
      <i className={`${styles.screw} ${styles.screwLeft}`} aria-hidden="true"/><i className={`${styles.screw} ${styles.screwRight}`} aria-hidden="true"/>
      <i className={`${styles.foot} ${styles.footLeft}`} aria-hidden="true"/><i className={`${styles.foot} ${styles.footRight}`} aria-hidden="true"/>
    </div>
      <div className={styles.library}>
        <div className={styles.libraryLabel}><span><UiIcon name="shuffle" size={16} tone="inherit"/>DISCOS DEL CLUB</span><div><button type="button" aria-label="Disco anterior" disabled={selection.length<2} onClick={()=>choose(index-1)}><UiIcon name="arrowLeft" size={18} tone="inherit"/></button><button type="button" aria-label="Disco siguiente" disabled={selection.length<2} onClick={()=>choose(index+1)}><UiIcon name="arrow" size={18} tone="inherit"/></button></div></div>
        <div ref={rail} className={styles.picker} aria-label="Releases de la tornamesa">{selection.map(({album:a},i)=><button ref={element=>{recordButtons.current[i]=element;}} type="button" key={a.id} aria-label={`Mostrar ${displayRelease(a).title} en la tornamesa`} aria-pressed={index%selection.length===i} onClick={()=>choose(i)}><CoverImage src={displayRelease(a).image} alt="" sizes="50px"/><span>{i+1}</span></button>)}</div>
      </div>
  </div>;
}
