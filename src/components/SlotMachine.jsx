"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {UiIcon} from './UiIcon';
import {choosePoolWinner} from '../utils/poolDraw.mjs';
import styles from './SlotMachine.module.css';

const cover=album=>album?.imagen || album?.image_url || '/musiclub_logo_corchea.png';
const title=album=>album?.album || album?.album_name || 'Musiclub';
export function SlotMachine({poolName="Pool Musical",albums=[],onSpinComplete,onSpinStart,onBusyChange,isSpinning=false,isAdmin=false,disabled=false}) {
  const candidates=useMemo(()=>{
    const active=albums.filter(a=>a.status==='ACTIVO');
    return active.length?active:albums;
  },[albums]);
  const [phase,setPhase]=useState('idle'),[draw,setDraw]=useState(null),[error,setError]=useState('');
  const locked=useRef(false),mounted=useRef(true),fallback=useRef(null),settling=useRef(false);
  const busy=phase==='spinning'||phase==='saving';
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;clearTimeout(fallback.current);};},[]);
  const finish=async(result)=>{
    if(settling.current||!mounted.current)return;
    settling.current=true;clearTimeout(fallback.current);setPhase('saving');
    try {
      await onSpinComplete(result.winner);
      if(mounted.current)setPhase('won');
    } catch(err) {
      if(mounted.current){setError(err.message||'No se pudo guardar el ganador. Actualiza la sala antes de volver a sortear.');setPhase('error');}
    } finally {
      locked.current=false;
      onBusyChange?.(false);
    }
  };
  const spin=()=>{
    if(locked.current||disabled||isSpinning||!isAdmin||!candidates.length||phase==='won'||phase==='error')return;
    locked.current=true;settling.current=false;setError('');onBusyChange?.(true);onSpinStart?.();
    const winner=choosePoolWinner(candidates);
    // A bounded strip freezes the candidates for this animation. No per-frame state updates.
    const visible=candidates.slice(0,12);
    const result={winner,reels:[0,1,2].map(offset=>Array.from({length:15},(_,i)=>i===14?winner:visible[(i+offset)%visible.length]))};
    setDraw(result);setPhase('spinning');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fallback.current=setTimeout(()=>finish(result),reduced?350:3400);
  };
  const ready=!disabled&&!isSpinning&&isAdmin&&candidates.length>0&&!busy&&phase==='idle';
  const message=phase==='won'?'El próximo disco ya tiene nombre':phase==='saving'?'Guardando el ganador y comprobando el aviso…':phase==='spinning'?'Que la música decida…':disabled?'Ya hay un disco elegido en esta sala':isAdmin?'Tira de la palanca. Descubre la próxima escucha.':'El administrador pondrá la música en movimiento.';
  return <section className={`${styles.machine} ${busy?styles.active:''} ${phase==='won'?styles.won:''}`} aria-label="Máquina Musical del Pool" aria-busy={busy}>
    <div className={styles.topline}><span><i/> {poolName}</span><span>{String(candidates.length).padStart(2,'0')} DISCOS EN JUEGO</span></div>
    <div className={styles.console}>
      <div className={styles.cabinet}>
        <div className={styles.marquee}><span/><b>MÁQUINA MUSICAL</b><span/></div>
        <div className={styles.window}>
          {[0,1,2].map(index=>{
            const strip=draw?.reels[index] || [candidates[index%candidates.length]];
            return <div className={styles.reel} key={index} aria-hidden="true">
              <div className={`${styles.strip} ${phase==='spinning'?styles.rolling:draw?styles.settled:''}`} style={{'--duration':`${2000+index*380}ms`}} onAnimationEnd={index===2&&phase==='spinning'?()=>finish(draw):undefined}>
                {strip.map((album,i)=><div className={styles.cell} key={i}><img src={cover(album)} alt="" loading="eager" decoding="async" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src='/musiclub_logo_corchea.png';}}/></div>)}
              </div>
            </div>;
          })}
          <div className={styles.payline}/>
        </div>
        <div className={styles.machineFoot}><span>UNA NUEVA HISTORIA EN CADA DISCO</span><UiIcon name="headphones" size={20} tone="inherit"/></div>
      </div>
      <button type="button" className={styles.lever} disabled={!ready} onClick={spin} aria-label="Tirar palanca" title={ready?'Tirar palanca':'Máquina Musical no disponible'}><span className={styles.leverBase}/><span className={styles.arm}><span className={styles.knob}/></span><span className={styles.pull}>TIRAR<span>↓</span></span></button>
    </div>
    <div className={styles.status} role="status" aria-live="polite"><span className={styles.statusLight}/>{message}</div>
    {phase==='won'&&draw&&<div data-draw-confirmed="true" className={styles.result}><div className={styles.confetti} aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{'--n':i}}/>)}</div><UiIcon name="crown" size={32} tone="inherit"/><div><p>DISCO ELEGIDO</p><h4>{title(draw.winner)}</h4><span>{draw.winner.artista || draw.winner.artist_name}</span></div></div>}
    {error&&<p className={styles.error} role="alert">{error}</p>}
  </section>;
}
