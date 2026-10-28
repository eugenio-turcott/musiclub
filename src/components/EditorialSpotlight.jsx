'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import picks from '../data/editorialSpotlights.json';
import editorial from '../utils/editorialSpotlights.cjs';
import { getReleaseUrl } from '../utils/ratingUtils';
import styles from './EditorialSpotlight.module.css';

const entries = editorial.activeSpotlights(picks);
const SLIDE_DURATION = 7000;
export function EditorialSpotlight() {
  const id = useId();
  const section = useRef(null);
  const touch = useRef(null);
  const swiped = useRef(false);
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [visible, setVisible] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (section.current) observer.observe(section.current);
    entries.forEach(entry => { const image = new Image(); image.src = entry.artwork; });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setProgress(0);
    if (!visible || entries.length < 2) return;
    let started = performance.now();
    const timer = window.setInterval(() => {
      // Do not consume a slide's time while its browser tab is hidden.
      if (document.hidden) { started = performance.now(); setProgress(0); return; }
      const elapsed = performance.now() - started;
      if (elapsed >= SLIDE_DURATION) { setProgress(0); setSelected(index => (index + 1) % entries.length); }
      else setProgress(elapsed / SLIDE_DURATION * 100);
    }, 100);
    return () => window.clearInterval(timer);
  }, [visible, selected, cycle]);
  if (!entries.length) return null;
  const current = entries[selected];
  const choose = index => {
    const next = (index + entries.length) % entries.length;
    setSelected(next);
    setCycle(value => value + 1);
    setAnnouncement(`${entries[next].category}: ${entries[next].artist}, ${entries[next].release}`);
  };
  const url = getReleaseUrl({ album_name: current.release, artist_name: current.artist, release_type: 'ALBUM' });
  return <section ref={section} aria-labelledby={`${id}-title`} aria-roledescription="carrusel" className={styles.section}>
    <header className={styles.heading}><h2 id={`${id}-title`}>En el radar.</h2><span className={styles.category}>{current.category}</span></header>
    <div className={`${styles.billboard} ${styles[current.tone]}`}>
      <div key={current.id} className={styles.slide} role="group" aria-roledescription="diapositiva" aria-label={`${selected + 1} de ${entries.length}: ${current.category}`}
        onTouchStart={event => { swiped.current = false; touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={event => {
          if (!touch.current) return;
          const dx = event.changedTouches[0].clientX - touch.current.x;
          const dy = event.changedTouches[0].clientY - touch.current.y;
          touch.current = null;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; choose(selected + (dx < 0 ? 1 : -1)); }
        }}>
        <Link to={url} className={styles.artLink} aria-label={`Descubrir ${current.release} de ${current.artist}`} onClick={event => { if (swiped.current) { event.preventDefault(); swiped.current = false; } }}>
          <img src={current.artwork} width="1600" height="640" loading="lazy" decoding="async" alt="" className={styles.artwork}/>
        </Link>
        <div className={styles.caption}><div><h3 translate="no">{current.artist}</h3><p translate="no">{current.release}</p></div><Link to={url} aria-label={`Ver el release ${current.release}`}>Ver release <span aria-hidden="true">↗</span></Link></div>
      </div>
    </div>
    <div className={styles.controls} aria-label="Progreso del carrusel automático">
      <div className={styles.progressSegments}>{entries.map((entry, index) => <button key={entry.id} type="button" aria-label={`Mostrar ${entry.category}`} aria-current={selected === index ? 'true' : undefined} onClick={() => choose(index)} className={styles.segment}>
        <span className={styles.segmentTrack}><span style={{transform:`scaleX(${index < selected ? 1 : index === selected ? progress/100 : 0})`}}/></span>
        <span className={styles.segmentLabel}>{entry.category}</span>
      </button>)}</div>
      <span role="progressbar" aria-label="Tiempo para la siguiente diapositiva" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className={styles.remaining}>Siguiente en {Math.max(1,Math.ceil((100-progress)/100*SLIDE_DURATION/1000))} s</span>
    </div>
    <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</p>
  </section>;
}
