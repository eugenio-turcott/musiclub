'use client';
import { useEffect, useRef, useState } from 'react';
import visuals from '../utils/genreVisuals.cjs';
import styles from './PoolCapsuleDeposit.module.css';

export function PoolCapsulePreview({ release, user }) {
  const [phase, setPhase] = useState('ready');
  const timer = useRef(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const album = { albumName: release?.album_name || 'Tu próximo descubrimiento', imageUrl: release?.image_url || '/musiclub_logo_corchea.png', genres: release?.genres || ['Pop'] };
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
