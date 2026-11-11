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

export function LandingTurntable({selection,paused=false}) {
  const [index,setIndex]=useState(0), [down,setDown]=useState(true), [gesture,setGesture]=useState(0);
  const [inView,setInView]=useState(false), [hovering,setHovering]=useState(false), [focused,setFocused]=useState(false), [dragging,setDragging]=useState(false);
  const scene=useRef(null), sound=useRef(null), drag=useRef(null), ignoreClick=useRef(false), recordButtons=useRef([]), rail=useRef(null);
  const selected=selection[index%Math.max(1,selection.length)], album=selected?.album, release=displayRelease(album);
  const mood=getEmotionFromReview(selected?.review), art=visuals.genreRevealArtwork(release.genres[0]||'Pop');
  const score=album?.final_rating==null?'—':Number(album.final_rating).toFixed(1);

  // Short local effects start only from a user gesture, allowing the browser to
  // unlock audio naturally. Automatic cover changes never start a sound.
  const chime=kind=>{
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

  useEffect(()=>{
    if(!('IntersectionObserver' in window)){setInView(true);return;}
    const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{threshold:.15});
    observer.observe(scene.current);return()=>observer.disconnect();
  },[]);
  const cycling=selection.length>1&&inView&&!paused&&!hovering&&!focused&&!dragging&&down;
  useEffect(()=>{
    if(!cycling)return;
    const timer=setInterval(()=>setIndex(i=>(i+1)%selection.length),6500);
    return()=>clearInterval(timer);
  },[cycling,selection.length,gesture]);
  useEffect(()=>{
    const button=recordButtons.current[index%Math.max(1,selection.length)],list=rail.current;
    if(button&&list)list.scrollTo({left:Math.max(0,button.offsetLeft-list.offsetLeft-list.clientWidth/2+button.clientWidth/2),behavior:'auto'});
  },[index,selection.length]);

  const needle=value=>{setDown(value);setGesture(n=>n+1);chime(value?'lower':'lift');};
  const choose=i=>{
    if(!selection.length)return;
    const next=(i+selection.length)%selection.length;
    setIndex(next);setDown(true);setGesture(n=>n+1);chime('change');
  };

  return <div ref={scene} className={styles.studio} aria-label="Tornamesa interactiva de Musiclub" data-needle-down={down} data-turntable-cycling={cycling}
    onFocusCapture={event=>setFocused(event.target.matches(':focus-visible'))} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}>
    <div className={styles.halo} aria-hidden="true"/>
    <div className={styles.deck} data-turntable-deck="">
      <header className={styles.brand}>
        <span><img src="/musiclub_logo_corchea.png" alt="" width="25" height="25"/><b>MUSICLUB</b><small>33⅓ · ESTÉREO</small></span>
        <span className={styles.mood} role="img" aria-label={`Estado de ánimo: ${mood.label}`} title={mood.label}><MoodIcon mood={mood.id} size={42}/></span>
      </header>

      {album?<Link to={getReleaseUrl(album)} className={styles.display} aria-label={`Ver release: ${release.title}`} data-turntable-display=""
        onPointerEnter={()=>setHovering(true)} onPointerLeave={()=>setHovering(false)}>
        {selection.map(({album:a},i)=><span key={a.id} className={styles.cover} data-active={i===index%selection.length} aria-hidden={i!==index%selection.length}><CoverImage src={displayRelease(a).image} alt={displayRelease(a).title} sizes="180px" loading="eager"/></span>)}
        <span className={styles.displayText} key={album.id}><strong>{release.title}</strong><small>{release.artist}</small></span>
        {release.genres[0]&&<span className={styles.genre}><UiIcon name="tag" size={13} tone="inherit"/>{release.genres[0]}</span>}
        <span className={styles.displayIndex}><b>{String(index%selection.length+1).padStart(2,'0')}<small>/{selection.length}</small></b></span>
      </Link>:<div className={styles.display}><p>Los releases con reseñas aparecerán aquí.</p></div>}

      <div className={styles.mechanism}>
        <div className={styles.platter} aria-hidden="true"><div className={styles.record} data-turntable-record=""><img src={art.disc} alt=""/><img className={styles.motif} src={art.center} alt=""/></div><i className={styles.spindle}/>
          {gesture>0&&<span className={styles.magic} key={gesture}>{[0,1,2,3,4,5].map(i=><span key={i} style={{'--i':i}}><UiIcon name="sparkles" size={15} tone="inherit"/></span>)}</span>}
        </div>
        <button type="button" className={styles.needle} aria-label={down?'Levantar aguja':'Bajar aguja'} aria-pressed={down} title="Pulsa o arrastra la aguja" disabled={!album}
          onClick={()=>{if(ignoreClick.current){ignoreClick.current=false;return;}needle(!down);}}
          onPointerDown={event=>{if(event.button!==0)return;setDragging(true);drag.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
          onPointerUp={event=>{setDragging(false);const from=drag.current;drag.current=null;if(!from)return;const dx=event.clientX-from.x,dy=event.clientY-from.y;if(Math.hypot(dx,dy)>12){ignoreClick.current=true;needle(Math.abs(dx)>Math.abs(dy)?dx<0:dy>0);}}}
          onPointerCancel={()=>{setDragging(false);drag.current=null;}}><span className={styles.needleAssembly}><span className={styles.pivot}/><span className={styles.arm}/><span className={styles.cartridge}/></span></button>
      </div>

      <div className={styles.console} data-turntable-console="">
        <button type="button" className={styles.motor} aria-label={down?'Detener vinilo':'Girar vinilo'} aria-pressed={down} disabled={!album} onClick={()=>needle(!down)}><UiIcon name={down?'pause':'play'} size={23} tone="inherit"/><i/></button>
        <div className={styles.visualizer} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>
        <div className={styles.score} aria-label={`Calificación del club: ${score} de 10`}><UiIcon name="star" size={22} tone="inherit"/><strong>{score}<small>/10</small></strong><span>{album?.review_count||0} {album?.review_count===1?'RESEÑA':'RESEÑAS'}</span></div>
      </div>
      <i className={`${styles.screw} ${styles.screwLeft}`} aria-hidden="true"/><i className={`${styles.screw} ${styles.screwRight}`} aria-hidden="true"/>
      <i className={`${styles.foot} ${styles.footLeft}`} aria-hidden="true"/><i className={`${styles.foot} ${styles.footRight}`} aria-hidden="true"/>
    </div>
      <div className={styles.library}>
        <div className={styles.libraryLabel}><span><UiIcon name="shuffle" size={16} tone="inherit"/>DISCOS DEL CLUB</span></div>
        <div ref={rail} className={styles.picker} aria-label="Releases de la tornamesa">{selection.map(({album:a},i)=><button ref={element=>{recordButtons.current[i]=element;}} type="button" key={a.id} aria-label={`Mostrar ${displayRelease(a).title} en la tornamesa`} aria-pressed={index%selection.length===i} onClick={()=>choose(i)}><CoverImage src={displayRelease(a).image} alt="" sizes="50px"/><span>{i+1}</span></button>)}</div>
      </div>
  </div>;
}
