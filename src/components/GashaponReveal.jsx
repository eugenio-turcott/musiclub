'use client';
import React, { useMemo } from 'react';
import visuals from '../utils/genreVisuals.cjs';
import styles from './GashaponReveal.module.css';

export function GashaponReveal({ genre, edition, stage, duration = 2400, startedAt = 0, album, onOpen }) {
  const art = visuals.genreRevealArtwork(genre, edition);
  const elapsed = useMemo(() => startedAt ? Math.min(Date.now() - startedAt, duration) : 0, [startedAt, duration]);
  const interactive = stage === 'READY';
  return <div className={styles.scene} data-stage={stage.toLowerCase()} data-vinyl-reveal data-vinyl-edition={art.id} style={{'--opening-duration':`${duration}ms`, '--opening-delay':`${-elapsed}ms`, '--vinyl-base':art.base, '--vinyl-accent':art.accent, '--vinyl-highlight':art.highlight}}>
    <div className={styles.stage}>
    <div className={styles.aura} aria-hidden="true" />
    <div className={styles.orbit} aria-hidden="true" />
    <button type="button" onClick={onOpen} disabled={!interactive} aria-hidden={!interactive} aria-label={`Abrir cápsula de ${art.name}`} className={styles.capsule} data-vinyl-capsule>
      <span className={styles.record} aria-hidden="true"><img src={art.disc} width="320" height="320" alt="" draggable="false" className={styles.disc} /></span>
      <span className={styles.label} data-vinyl-center aria-hidden="true"><img src={art.center} width="160" height="160" alt="" draggable="false" /></span>
      <span className={styles.ripple} aria-hidden="true" />
    </button>
    <div className={styles.flash} data-vinyl-flash aria-hidden="true" />
    <div className={styles.poster} aria-hidden={stage !== 'REVEALED'} data-vinyl-cover>
      <img onError={event => { if (!event.currentTarget.src.endsWith('/musiclub_logo_corchea.png')) event.currentTarget.src = '/musiclub_logo_corchea.png'; }} src={album?.imagen || album?.image_url || '/musiclub_logo_corchea.png'} alt={stage === 'REVEALED' ? album?.album || album?.album_name || '' : ''} width="240" height="240" decoding="async" loading="eager" draggable="false" />
    </div>
    </div>
    <span className={styles.readyHint} aria-hidden="true">TOCA EL VINILO</span>
  </div>;
}
