'use client';
import { InterfaceText } from './UiIcon';
import { Link } from 'react-router-dom';
import { GenreArtwork } from './GenreArtwork';
import { MusiclubVinyl } from './MusiclubVinyl';
import presentation from '../utils/poolPresentation.cjs';

export function PoolHero({ season, waiting = 0, winners = 0, isOpen = false, isAdmin = false, busy = false, onDeposit, onOpen, hasEntry = false, canEdit = false, preview = false, ownerName }) {
  const a = presentation.poolAppearance(season.appearance);
  const capacity = presentation.poolCapacity(season, season.entry_count || 0);
  const title = a.heading || season.name || 'Pool Musical Comunitario';
  const intro = a.intro || season.description || 'Propón un release, descubre el disco elegido y compártelo con el club.';
  const date = season.start_date && new Date(`${season.start_date}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  return <section aria-label={preview ? 'Vista previa de la cabecera' : 'Pool activo'} style={{ background: presentation.poolBackground(a), '--pool-media-size': `${a.mediaSize}px` }} className="relative isolate overflow-hidden rounded-3xl border border-white/10 p-5 text-left shadow-xl sm:p-8">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-[#070812]/70 to-[#070812]/30" />
    {a.vinyl !== 'none' && <div aria-hidden="true" className="pointer-events-none absolute right-5 top-5 -z-10 h-40 w-40 select-none opacity-40 sm:right-8 sm:top-8 sm:h-64 sm:w-64 lg:h-72 lg:w-72">
      {a.vinyl === 'genre' ? <GenreArtwork genre={a.genre} size={320} animated className="h-full w-full" /> : <MusiclubVinyl src={a.logo} alt="" className="h-full w-full animate-spin-slow" />}
    </div>}
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
      <span className="rounded-full border border-purple-300/20 bg-purple-500/15 px-3 py-1.5 text-purple-200"><InterfaceText>{"♫ Temporada "}</InterfaceText>{season.season_number || 1}</span>
      <span className={`rounded-full border px-3 py-1.5 ${isOpen ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/25 bg-amber-500/10 text-amber-200'}`}>{capacity.full ? 'Cupo completo' : isOpen ? 'Propuestas abiertas' : 'Propuestas cerradas'}</span>
      {date && <span className="text-slate-400">Desde {date}</span>}
    </div>
    <div className="mt-5 flex min-w-0 items-start justify-between gap-4 sm:gap-8">
      <div className="min-w-0 flex-1 sm:pr-48 lg:pr-72">
        {preview ? <p className="break-words text-2xl font-black leading-tight text-white">{title}</p> : <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>}
        <p className="mt-3 max-w-3xl whitespace-pre-line break-words text-sm leading-relaxed text-slate-300">{intro}</p>
      </div>
    </div>
    {a.intro && season.description && a.intro.trim() !== season.description.trim() && <details className="mt-4 max-w-3xl rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-300"><summary className="cursor-pointer font-bold text-purple-200">Cómo participar · reglas del Pool</summary><p className="mt-3 whitespace-pre-line break-words leading-relaxed">{season.description}</p></details>}
    {!preview && <>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <button type="button" disabled={busy || (hasEntry ? !canEdit : !isOpen)} onClick={onDeposit} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#f5576c] to-[#f093fb] px-5 text-sm font-black text-white shadow-lg shadow-pink-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-white/5 disabled:to-white/5 disabled:text-slate-500 disabled:shadow-none"><InterfaceText>{hasEntry ? canEdit ? '✎ Editar mi cápsula' : 'Mi cápsula ya está registrada' : isOpen ? '＋ Depositar cápsula' : '🔒 Propuestas cerradas'}</InterfaceText></button>
        <Link to={`/gashapon?pool=${encodeURIComponent(season.id)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"><InterfaceText>{"🎰 Descubrir releases del Pool"}</InterfaceText></Link>
        {!isOpen && isAdmin && <button type="button" disabled={busy || capacity.full} onClick={onOpen} className="min-h-11 rounded-xl px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40">Abrir propuestas</button>}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">Una cápsula por persona en cada temporada de esta sala. Puedes cambiar tu release mientras esté en espera y las propuestas sigan abiertas.</p>
      {!isOpen && <p className="mt-3 text-xs leading-relaxed text-slate-400">{capacity.full ? 'Todos los lugares están ocupados.' : 'Por ahora no se reciben nuevas cápsulas.'} Puedes explorar las propuestas y escuchar el disco elegido.</p>}
    </>}
    {(!preview || a.mediaUrl) && <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 sm:flex-nowrap sm:gap-8">
      {!preview && <dl className={`grid min-w-0 flex-1 gap-3 sm:gap-8 lg:gap-12 ${capacity.limit ? 'grid-cols-3 sm:max-w-[480px]' : 'grid-cols-2 sm:max-w-72'}`}>
        <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">En espera</dt><dd className="mt-1 text-xl font-black text-pink-300">{waiting}</dd></div>
        <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Discos elegidos</dt><dd className="mt-1 text-xl font-black text-amber-300">{winners}</dd></div>
        {capacity.limit && <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Cápsulas / cupo</dt><dd className="mt-1 text-xl font-black text-purple-200">{capacity.used} <span className="text-sm text-slate-400">/ {capacity.limit}</span></dd></div>}
      </dl>}
      {a.mediaUrl && <img src={a.mediaUrl} alt="" style={{ '--pool-media-size': `${a.mediaSize}px` }} className="aspect-square w-20 shrink-0 rounded-2xl border border-white/10 bg-black/15 object-contain p-1 sm:w-[var(--pool-media-size)] sm:max-w-[24%]" onError={event => { event.currentTarget.hidden = true; }} />}
      {!preview && ownerName && <p className="ml-auto max-w-60 self-end break-words text-right text-xs leading-relaxed text-slate-400">Dueño del Pool<br/><strong className="font-bold text-pink-200">{ownerName}</strong></p>}
    </div>}
  </section>;
}
