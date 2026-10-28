'use client';
import { InterfaceText } from './UiIcon';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import picks from '../data/editorialSpotlights.json';
import editorial from '../utils/editorialSpotlights.cjs';
import { getReleaseUrl } from '../utils/ratingUtils';
import styles from './EditorialSpotlight.module.css';

const entries = editorial.activeSpotlights(picks);
export function EditorialSpotlight() {
  const id = useId();
  const section = useRef(null);
  const touch = useRef(null);
  const swiped = useRef(false);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (section.current) observer.observe(section.current);
    entries.forEach(entry => { const image = new Image(); image.src = entry.artwork; });
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || !visible || reducedMotion || entries.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSelected(index => (index + 1) % entries.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, visible, reducedMotion, selected]);
  if (!entries.length) return null;
  const current = entries[selected];
  const choose = index => {
    const next = (index + entries.length) % entries.length;
    setSelected(next);
    setAnnouncement(`${entries[next].category}: ${entries[next].artist}, ${entries[next].release}`);
  };
  const url = getReleaseUrl({ album_name: current.release, artist_name: current.artist, release_type: 'ALBUM' });
  return <section ref={section} aria-labelledby={`${id}-title`} aria-roledescription="carrusel" className={styles.section}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
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
    <div className={styles.controls} aria-label="Controles del carrusel">
      <div className={styles.dots}>{entries.map((entry, index) => <button key={entry.id} type="button" aria-label={`Mostrar ${entry.category}`} aria-current={selected === index ? 'true' : undefined} onClick={() => choose(index)} className={`${styles.dot} ${selected === index ? styles.active : ''}`}><span/></button>)}</div>
      <div className={styles.navigation}>
        {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}><InterfaceText>{paused ? '▶' : 'Ⅱ'}</InterfaceText></button>}
        <button type="button" onClick={() => choose(selected - 1)} aria-label="Release anterior">←</button>
        <button type="button" onClick={() => choose(selected + 1)} aria-label="Release siguiente">→</button>
      </div>
    </div>
    <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</p>
  </section>;
}
