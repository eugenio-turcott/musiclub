'use client';
import Link from 'next/link';
import {useState} from 'react';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {AnnualArtOpening} from './AnnualArtOpening';
import styles from '../views/AnnualPage.module.css';

export function AnnualComingSoon(){
  const [genre,setGenre]=useState('Pop');
  return <AnnualArtOpening>
    <section className={styles.soonIntro} data-opening-panel="intro" aria-label="Musiclub 2026 · Próximamente">
      <div className={styles.soonIntroCopy}>
        <span className={styles.soonEyebrow}><UiIcon name="sparkles" size={32}/> PRÓXIMAMENTE</span>
        <h2>Musiclub<br/><em>2026.</em></h2>
        <p>Los descubrimientos, las reseñas y la música que compartimos este año.</p>
        <a href="#tu-2026" className={styles.soonMainLink}>Y tu propio 2026 <UiIcon name="arrowDown" size={30}/></a>
      </div>
      <div className={styles.yearTicket} aria-label="Edición anual de Musiclub">
        <div className={styles.ticketBrand}><img src="/musiclub_logo_corchea.png" width="60" height="60" alt="Musiclub"/><span>EDICIÓN ANUAL</span><UiIcon name="headphones" size={44}/></div>
        <div className={styles.ticketYear}>20<span>26</span><i aria-hidden="true"><UiIcon name="sparkles" size={65}/></i></div>
        <div className={styles.ticketGrooves} aria-hidden="true"/>
        <div className={styles.ticketFeatures}>{[['review','Reseñas'],['users','Comunidad'],['share','Tu resumen']].map(([icon,label])=><div key={icon}><UiIcon name={icon} size={42}/><strong>{label}</strong></div>)}</div>
        <div className={styles.ticketFoot}><span>TU MÚSICA. TU CRITERIO.</span><span>MUSICLUB / 2026</span></div>
      </div>
    </section>
    <section className={styles.soonPersonal} data-opening-panel="year" inert aria-hidden="true" aria-label="Tu resumen personal de 2026 · Próximamente">
      <div className={styles.soonPersonalCopy}><span className={styles.soonEyebrow}><UiIcon name="heart" size={32}/> TU PROPIO 2026</span><h2>Tu año.<br/><em>A tu manera.</em></h2><p>Tus reseñas, géneros y favoritos. Una edición de Musiclub para guardar y compartir.</p><div className={styles.soonHighlights}><span><UiIcon name="review"/>Lo que reseñaste</span><span><UiIcon name="star"/>Tus favoritos</span><span><UiIcon name="sparkles"/>Tu actividad</span></div><div className={styles.soonActions}><Link href="/catalogo" className={styles.soonMainLink}>Sigue construyendo tu año <UiIcon name="arrow"/></Link><a href="#inicio">Volver al mural <UiIcon name="arrowUp"/></a></div></div>
      <div className={styles.yearPreviewStack}>
        <div className={styles.yearPreviewBack} aria-hidden="true"><UiIcon name="music" size={90}/></div>
        <div className={styles.yearPreviewCard}><div className={styles.ticketBrand}><img src="/musiclub_logo_corchea.png" alt="" width="45" height="45"/><span>MI MUSICLUB</span><UiIcon name="share" size={34}/></div><strong className={styles.previewYear}>MI<br/><em>2026.</em></strong><div className={styles.previewGenre}><GenreArtwork genre={genre} size={145} animated/><div><UiIcon name="headphones" size={30}/><span>TUS GÉNEROS</span><strong>{genre}</strong></div></div><div className={styles.previewWave} aria-hidden="true">{Array.from({length:26},(_,i)=><i key={i} style={{height:8+(i*13%31)}}/>)}</div><span className={styles.previewSoon}><UiIcon name="lock" size={22}/> Próximamente en tu perfil</span></div>
        <div className={styles.previewGenreChoices} role="group" aria-label="Probar los vinilos de tu resumen">{['Pop','Rock','Hip-Hop','R&B','Indie','Electrónica'].map(g=><button key={g} type="button" aria-pressed={genre===g} onClick={()=>setGenre(g)}>{g}</button>)}</div>
      </div>
    </section>
  </AnnualArtOpening>;
}
