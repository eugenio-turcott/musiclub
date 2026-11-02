'use client';
import {setAdvertisingChoice,useAdvertisingPermission} from '../services/advertisingConsent';

export function AdvertisingConsentNotice() {
  const {choice,mode,privacySignal}=useAdvertisingPermission();
  if(mode!=='consent' || choice!=='unknown' || privacySignal) return null;
  return <section aria-label="Publicidad" className="my-10 w-full">
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Publicidad</p>
      <p className="mt-2 text-sm font-bold text-white">Un banner para apoyar al club</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">Con tu permiso, Adsterra y sus socios podrán usar cookies y datos del navegador para seleccionar y medir anuncios. Puedes cambiar tu elección al final de la página. <a href="/privacy" className="underline hover:text-pink-300">Privacidad</a>.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={()=>setAdvertisingChoice('accepted')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Permitir anuncios</button>
        <button type="button" onClick={()=>setAdvertisingChoice('rejected')} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-pink-300">Ahora no</button>
      </div>
    </div>
  </section>;
}
