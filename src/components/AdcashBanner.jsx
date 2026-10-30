'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { setAdvertisingChoice, useAdvertisingChoice } from '../services/advertisingConsent';

// Manual Display zone. Never substitute the onboarding Autotag here.
const ZONE_ID = '12384990';
const TARGET = 'musiclub-home-adcash';

export function AdcashBanner() {
  const choice = useAdvertisingChoice();
  const container = useRef(null);
  const slot = useRef(null);
  const rendered = useRef(false);
  const [fits, setFits] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const update = () => setFits(container.current?.getBoundingClientRect().width >= 300);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [choice]);

  useEffect(() => {
    if (choice !== 'accepted' || !fits || !ready || rendered.current || !slot.current) return;
    if (typeof window.aclib?.runBanner !== 'function') { setFailed(true); return; }
    try {
      rendered.current = true;
      // Only the public placement ID and its container are sent to the library.
      window.aclib.runBanner({zoneId: ZONE_ID, renderIn: `#${TARGET}`});
    } catch { setFailed(true); }
  }, [choice, fits, ready]);

  // Keep the existing banner mounted when the viewport shrinks after rendering.
  // A narrow viewport hides it rather than creating a second ad impression.
  const visible = !failed && (choice === 'unknown' || (choice === 'accepted' && fits));
  return <section ref={container} aria-label="Publicidad" className={`w-full ${visible ? 'my-10' : ''}`}>
    {choice === 'unknown' && !failed && <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Publicidad</p>
      <p className="mt-2 text-sm font-bold text-white">Un banner para apoyar al club</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">Con tu permiso, Adcash y sus socios podrán usar cookies y datos del navegador para seleccionar y medir anuncios. Puedes cambiar tu elección al final de la página. <a href="/privacy" className="underline hover:text-pink-300">Privacidad</a>.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => setAdvertisingChoice('accepted')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Permitir anuncios</button>
        <button type="button" onClick={() => setAdvertisingChoice('rejected')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Ahora no</button>
      </div>
    </div>}
    {choice === 'accepted' && <div hidden={!fits || failed} className="mx-auto w-[300px] max-w-full text-center">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Publicidad</p>
      <div ref={slot} id={TARGET} className="h-[250px] w-[300px] overflow-hidden rounded-xl bg-white/[0.025]" />
      {(fits || rendered.current) && !failed && <Script id="musiclub-adcash-library" src="https://acscdn.com/script/aclib.js" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />}
    </div>}
  </section>;
}
