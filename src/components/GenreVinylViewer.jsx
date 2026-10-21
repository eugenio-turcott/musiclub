'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GenreArtwork } from './GenreArtwork';
import visuals from '../utils/genreVisuals.cjs';
import styles from './GenreVinylViewer.module.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const deltaAngle = (next, previous) => ((next - previous + 540) % 360) - 180;

function VinylDialog({ genre, onClose }) {
  const dialog = useRef(null), disc = useRef(null), stage = useRef(null);
  const motion = useRef({ angle: 0, velocity: 0, pointers: new Map(), previous: null, pinch: null });
  const [spinning, setSpinning] = useState(false), [zoom, setZoom] = useState(1), [dragging, setDragging] = useState(false);
  const zoomRef = useRef(1), autoSpin = useRef(false);
  const pressing = visuals.genreRevealArtwork(genre.id);
  const changeZoom = value => {
    const next = clamp(value, 1, 1.8);
    zoomRef.current = next;
    setZoom(next);
  };
  const paint = () => disc.current?.style.setProperty('--rotation', `${motion.current.angle}deg`);

  useEffect(() => {
    const element = dialog.current, previousFocus = document.activeElement, overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    setSpinning(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => { autoSpin.current = spinning; }, [spinning]);
  useEffect(() => {
    let frame, previousTime;
    const tick = now => {
      const dt = Math.min((now - (previousTime ?? now)) / 1000, .05);
      previousTime = now;
      const state = motion.current;
      if (!state.pointers.size) {
        state.angle += (state.velocity + (autoSpin.current ? 12 : 0)) * dt;
        state.velocity *= Math.exp(-3.2 * dt);
        if (Math.abs(state.velocity) < .1) state.velocity = 0;
        // Keep the value bounded without a visible rotation jump.
        state.angle %= 360;
        paint();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const element = stage.current;
    const wheel = event => { event.preventDefault(); changeZoom(zoomRef.current - event.deltaY * .0015); };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);

  const position = event => {
    const bounds = stage.current.getBoundingClientRect();
    return { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 };
  };
  const pointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const state = motion.current, point = position(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    state.pointers.set(event.pointerId, point);
    state.velocity = 0;
    state.previous = { angle: Math.atan2(point.y, point.x) * 180 / Math.PI, time: performance.now() };
    if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      state.pinch = { distance: Math.hypot(a.x-b.x, a.y-b.y), zoom: zoomRef.current };
    }
    setSpinning(false);
    setDragging(true);
  };
  const pointerMove = event => {
    const state = motion.current;
    if (!state.pointers.has(event.pointerId)) return;
    const point = position(event);
    state.pointers.set(event.pointerId, point);
    if (state.pointers.size === 2 && state.pinch) {
      const [a, b] = [...state.pointers.values()];
      changeZoom(state.pinch.zoom * Math.hypot(a.x-b.x, a.y-b.y) / Math.max(1, state.pinch.distance));
      state.previous = null;
      return;
    }
    // Avoid an unstable angle when the finger crosses the spindle.
    if (Math.hypot(point.x, point.y) < 22) { state.previous = null; return; }
    const angle = Math.atan2(point.y, point.x) * 180 / Math.PI, now = performance.now();
    if (state.previous) {
      const delta = deltaAngle(angle, state.previous.angle);
      state.angle += delta;
      state.velocity = clamp(delta / Math.max(8, now-state.previous.time) * 1000, -600, 600);
      paint();
    }
    state.previous = { angle, time: now };
  };
  const pointerEnd = event => {
    const state = motion.current;
    if (!state.pointers.delete(event.pointerId)) return;
    state.pinch = null;
    if (event.type === 'pointercancel' || (state.previous && performance.now()-state.previous.time > 120)) state.velocity = 0;
    state.previous = null;
    setDragging(state.pointers.size > 0);
  };
  const reset = () => {
    motion.current.angle = 0;
    motion.current.velocity = 0;
    setSpinning(false);
    changeZoom(1);
    paint();
  };
  const keyDown = event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setSpinning(false);
      motion.current.velocity = 0;
      motion.current.angle += (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 45 : 15);
      paint();
    } else if (event.key === 'Home') { event.preventDefault(); reset(); }
  };

  return createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="vinyl-viewer-title" onCancel={event => { event.preventDefault(); onClose(); }} onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.frame} style={{ '--record-color': pressing.base, '--record-accent': pressing.accent }}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>LA IDENTIDAD DE UN SONIDO</p><h2 id="vinyl-viewer-title" translate="no">{genre.name}</h2></div>
        <button type="button" autoFocus onClick={onClose} className={styles.close} aria-label="Cerrar vinilo ampliado">×</button>
      </header>
      <div ref={stage} className={`${styles.stage} ${dragging ? styles.dragging : ''}`} tabIndex={0} role="group" aria-label={`Vinilo interactivo de ${genre.name}`} aria-describedby="vinyl-viewer-instructions" aria-keyshortcuts="ArrowLeft ArrowRight Home" onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.recordScale} style={{ '--zoom': zoom }}><div ref={disc} className={styles.record} data-interactive-vinyl><GenreArtwork genre={genre.id} size={900} className={styles.artwork} /></div></div>
        <span className={styles.stageNote} aria-hidden="true">{dragging ? 'Tú llevas el ritmo' : 'Dale una vuelta'}</span>
      </div>
      <footer className={styles.footer}>
        <p id="vinyl-viewer-instructions" className={styles.instructions}>Arrastra para girar · Pellizca o usa el zoom para acercarte<span>Con teclado, usa ← y → para girar.</span></p>
        <div className={styles.controls}>
          <button type="button" className={styles.spin} aria-pressed={spinning} onClick={() => { motion.current.velocity = 0; setSpinning(value => !value); }}><span aria-hidden="true">{spinning ? 'Ⅱ' : '▷'}</span>{spinning ? 'Pausar giro' : 'Girar solo'}</button>
          <div className={styles.zoom}>
            <button type="button" aria-label="Alejar vinilo" disabled={zoom <= 1} onClick={() => changeZoom(zoom-.2)}>−</button>
            <label className={styles.zoomSlider}><span className={styles.srOnly}>Zoom del vinilo</span><input aria-label="Zoom del vinilo" type="range" min="100" max="180" step="1" value={Math.round(zoom*100)} onChange={event => changeZoom(Number(event.target.value)/100)} /></label>
            <button type="button" aria-label="Acercar vinilo" disabled={zoom >= 1.8} onClick={() => changeZoom(zoom+.2)}>+</button>
            <output aria-label="Nivel de zoom">{Math.round(zoom*100)}%</output>
          </div>
          <button type="button" className={styles.reset} onClick={reset}>Restablecer</button>
        </div>
      </footer>
    </div>
  </dialog>, document.body);
}

export function GenreVinylViewer({ genre, className = '' }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={styles.trigger} aria-label={`Ampliar vinilo de ${genre.name}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <GenreArtwork genre={genre.id} size={370} animated className={className} />
      <span className={styles.triggerHint} aria-hidden="true"><span>＋</span> Explorar vinilo</span>
    </button>
    {open && <VinylDialog genre={genre} onClose={() => setOpen(false)} />}
  </>;
}
