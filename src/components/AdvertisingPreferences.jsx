'use client';
import { useRef } from 'react';
import { setAdvertisingChoice, useAdvertisingChoice } from '../services/advertisingConsent';

export function AdvertisingPreferences() {
  const dialog = useRef(null);
  const choice = useAdvertisingChoice();
  const choose = value => { dialog.current?.close(); setAdvertisingChoice(value); };
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className="underline transition-colors hover:text-pink-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300">Preferencias de publicidad</button>
    <dialog ref={dialog} aria-labelledby="advertising-preferences-title" className="m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[calc(100dvh_-_2rem)] overflow-y-auto rounded-3xl border border-white/15 bg-[#111120] p-6 text-left text-sm text-slate-200 shadow-2xl backdrop:bg-black/75">
      <h2 id="advertising-preferences-title" className="text-xl font-black text-white">Tu elección de publicidad</h2>
      <p className="mt-3 leading-relaxed">Si permites los anuncios, Adcash y sus socios podrán usar cookies, identificadores y datos técnicos del navegador para seleccionar y medir publicidad. Musiclub prueba un banner en el inicio.</p>
      <p className="mt-3 leading-relaxed">Puedes rechazar o retirar tu permiso y seguir usando Musiclub. Guardamos esta elección durante un máximo de seis meses en este navegador.</p>
      <p className="mt-3">Estado: <strong>{choice === 'accepted' ? 'Permitida' : choice === 'rejected' ? 'Rechazada' : 'Sin elegir'}</strong>. <a href="/privacy" className="text-pink-300 underline hover:text-pink-100">Información de privacidad</a>.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose('accepted')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 font-bold transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Permitir anuncios</button>
        <button type="button" onClick={() => choose('rejected')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 font-bold transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Rechazar anuncios</button>
        <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-xl px-3 underline transition-colors hover:text-pink-300 focus-visible:outline-2 focus-visible:outline-pink-300">Cerrar</button>
      </div>
    </dialog>
  </>;
}
