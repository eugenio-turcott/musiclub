'use client';
import { useEffect, useRef, useState } from 'react';
import {createPortal} from 'react-dom';
import {UiIcon} from './UiIcon';
import visuals from '../utils/genreVisuals.cjs';
import styles from './PoolCapsuleDeposit.module.css';

export function PoolCapsulePreview({ release, user }) {
  const [phase, setPhase] = useState('ready');
  const timer = useRef(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const album = { albumName: release?.album_name || release?.album || 'Tu próximo descubrimiento', imageUrl: release?.image_url || release?.imagen || '/musiclub_logo_corchea.png', genres: release?.genres || ['Pop'] };
  return <details className="rounded-xl border border-white/10 p-3"><summary className="font-bold text-purple-200">Vista previa del depósito de cápsulas</summary><PoolCapsuleDeposit album={album} user={user} phase={phase}/><div className="text-center"><button type="button" disabled={phase === 'saving'} className="min-h-11 rounded-xl bg-pink-500/20 px-4 text-xs font-bold text-pink-200" onClick={()=>{setPhase('saving'); timer.current=setTimeout(()=>setPhase('saved'),2300);}}>{phase === 'ready' ? 'Ver animación' : phase === 'saving' ? 'Sellando cápsula…' : 'Repetir animación'}</button><p className="mt-2 text-[11px] text-slate-400">Solo es una vista previa. No registra una propuesta ni ocupa cupo.</p></div></details>;
}

export function PoolCapsuleToken({ album }) {
  const art = visuals.genreRevealArtwork(album?.genres?.[0]);
  return <div className={styles.token} aria-label={`Cápsula de ${art.name}, propuesta por ${album.added_by || 'Miembro'}`}>
    <img className={styles.disc} src={art.disc} alt="" loading="lazy" />
    <img className={styles.tokenCover} src={album.imagen || '/musiclub_logo_corchea.png'} alt={album.album} loading="lazy" onError={event=>{event.currentTarget.src='/musiclub_logo_corchea.png';}}/>
    <span className={styles.tokenGenre} title={art.name}><img src={art.center} alt={art.name}/></span>
    <span className={styles.tokenAvatar} title={album.added_by || 'Miembro'}><span>{Array.from(album.added_by || 'M')[0].toUpperCase()}</span>{album.nominated_avatar && <img src={album.nominated_avatar} alt="" onError={event=>{event.currentTarget.hidden=true;}}/>}</span>
  </div>;
}

export function PoolCapsuleDeposit({ album, user, phase = 'ready' }) {
  const art = visuals.genreRevealArtwork(album?.genres?.[0]);
  const name = user?.name || 'Miembro';
  const fallback = event => { event.currentTarget.hidden = true; };
  return <div className={styles.scene} data-phase={phase} style={{ '--capsule-accent': art.accent }} aria-label={`Cápsula de ${art.name}`}>
    <div className={styles.halo} aria-hidden="true" />
    <div className={styles.capsule}>
      <img className={styles.disc} src={art.disc} alt="" width="240" height="240" />
      <div className={styles.contents}>
        <img className={styles.cover} src={album?.imageUrl || '/musiclub_logo_corchea.png'} alt={album?.albumName || 'Portada del release'} onError={event => { event.currentTarget.src = '/musiclub_logo_corchea.png'; }} />
        <span className={styles.avatar} aria-label={`Propuesto por ${name}`}><span>{Array.from(name.trim())[0]?.toUpperCase() || 'M'}</span>{(user?.avatar_url || user?.avatar) && <img src={user.avatar_url || user.avatar} alt="" onError={fallback} />}</span>
      </div>
      <img className={styles.lid} src={art.center} alt="" width="120" height="120" />
    </div>
    <div className={styles.slot} aria-hidden="true"><span /></div>
    <p role="status" className={styles.caption}>{phase === 'saved' ? '¡Tu cápsula ya está en el Pool!' : phase === 'saving' ? 'Guardando y sellando tu cápsula…' : `Tu release, tu firma y el vinilo de ${art.name}`}</p>
  </div>;
}

export function PoolCapsuleViewer({album,onClose}) {
  const close=useRef(null);
  useEffect(()=>{
    const focused=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';close.current?.focus();
    const key=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){event.preventDefault();close.current?.focus();}};
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);focused?.focus?.();};
  },[onClose]);
  const art=visuals.genreRevealArtwork(album.genres?.[0]);
  return createPortal(<div className="fixed inset-0 z-[10000020] grid place-items-center overflow-y-auto bg-[#060710]/90 p-4 backdrop-blur-md" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><section role="dialog" aria-modal="true" aria-label={`Cápsula de ${album.album}`} className="relative my-4 w-full max-w-xl rounded-3xl border border-pink-300/20 bg-[#141328] p-6 text-center text-white shadow-2xl"><button ref={close} type="button" aria-label="Cerrar cápsula" onClick={onClose} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-pink-200 hover:bg-pink-400/15"><UiIcon name="close" size={22}/></button><p className="pt-4 text-[10px] font-black uppercase tracking-[.3em] text-pink-300">Dentro de la cápsula</p><h2 className="mt-3 break-words px-8 text-2xl font-black">{album.album}</h2><p className="mt-2 text-sm text-slate-300">{album.artista}</p><div className={`${styles.scene} ${styles.inspectionScene}`} data-capsule-loop="" style={{'--capsule-accent':art.accent}}><div className={styles.halo}/><div className={styles.capsule}><img className={styles.disc} src={art.disc} alt=""/><div className={styles.contents}><img className={styles.cover} src={album.imagen || '/musiclub_logo_corchea.png'} alt={album.album}/><span className={styles.avatar}><span>{Array.from(album.added_by || 'M')[0]}</span>{album.nominated_avatar&&<img src={album.nominated_avatar} alt={album.added_by}/>}</span></div><img className={styles.lid} src={art.center} alt={art.name}/></div></div><p className="text-sm font-bold text-pink-200">Propuesta por {album.added_by || 'un miembro'}</p><p className="mt-2 text-xs text-slate-400">{art.name} · Una portada, una firma y una próxima escucha.</p></section></div>,document.body);
}
