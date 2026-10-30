'use client';
import { useEffect, useRef, useState } from 'react';
import { setAdvertisingChoice, useAdvertisingChoice } from '../services/advertisingConsent';

export function AdvertisingPreferences() {
  const dialog = useRef(null);
  const choice = useAdvertisingChoice();
  const [privacySignal, setPrivacySignal] = useState(false);
  useEffect(() => { setPrivacySignal(navigator.globalPrivacyControl === true); }, []);
  const choose = value => { dialog.current?.close(); setAdvertisingChoice(value); };
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className="underline transition-colors hover:text-pink-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300">Preferencias de publicidad</button>
    <dialog ref={dialog} aria-labelledby="advertising-preferences-title" className="m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[calc(100dvh_-_2rem)] overflow-y-auto rounded-3xl border border-white/15 bg-[#111120] p-6 text-left text-sm text-slate-200 shadow-2xl backdrop:bg-black/75">
      <h2 id="advertising-preferences-title" className="text-xl font-black text-white">Tu elección de publicidad</h2>
      <p className="mt-3 leading-relaxed">Musiclub muestra banners de Adcash en sus páginas públicas. Adcash y sus socios pueden usar cookies, identificadores y datos técnicos del navegador para seleccionar y medir publicidad.</p>
      <p className="mt-3 leading-relaxed">En México los banners pueden cargarse automáticamente. En las demás ubicaciones solicitamos permiso previo. Puedes desactivar los anuncios y seguir usando Musiclub. Guardamos tu elección durante un máximo de seis meses en este navegador.</p>
      {privacySignal && <p className="mt-3 text-pink-200">Tu navegador envía una señal de control global de privacidad. La respetamos y mantenemos los anuncios desactivados.</p>}
      <p className="mt-3">Estado: <strong>{privacySignal ? 'Desactivada por el navegador' : choice === 'accepted' ? 'Permitida' : choice === 'rejected' ? 'Rechazada' : 'Según la configuración regional'}</strong>. <a href="/privacy" className="text-pink-300 underline hover:text-pink-100">Información de privacidad</a>.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={privacySignal} onClick={() => choose('accepted')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 font-bold transition-colors hover:bg-white/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-pink-300">Permitir anuncios</button>
        <button type="button" onClick={() => choose('rejected')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 font-bold transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Rechazar anuncios</button>
        <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-xl px-3 underline transition-colors hover:text-pink-300 focus-visible:outline-2 focus-visible:outline-pink-300">Cerrar</button>
      </div>
    </dialog>
  </>;
}
